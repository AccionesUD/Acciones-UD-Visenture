import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { PremiumPlan } from 'src/premium/entities/premium-plan.entity';
import { Role } from 'src/roles-permission/entities/role.entity';
import { PaymentsService } from 'src/payments/services/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(PremiumPlan)
    private readonly premiumPlanRepo: Repository<PremiumPlan>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async subscribeToPremium(
    accountId: number,
    planId: number,
  ): Promise<{ message: string; plan: string }> {
    // 1) Verificar plan
    const plan = await this.premiumPlanRepo.findOne({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Plan no existe');
    }

    // 2) Calcular fechas
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + plan.duration_days);

    // 3) Obtener cuenta con roles actuales
    const account = await this.accountRepo.findOne({
      where: { id: accountId },
      relations: ['roles'],
    });
    if (!account) {
      throw new BadRequestException('Cuenta no encontrada');
    }

    // 4) Crear y guardar la suscripción
    const subscription = this.subscriptionRepo.create({
      account,
      plan,
      start_date: start,
      end_date: end,
      status: SubscriptionStatus.ACTIVE,
    });
    await this.subscriptionRepo.save(subscription);

    // 5) Asignar rol usuario_premium si aún no lo tiene
    const yaPremium = account.roles.some((r) => r.name === 'usuario_premium');
    if (!yaPremium) {
      const premiumRole = await this.roleRepo.findOne({
        where: { name: 'usuario_premium' },
      });
      if (!premiumRole) {
        throw new HttpException(
          'Rol usuario_premium no definido en la base de datos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      await this.accountRepo
        .createQueryBuilder()
        .relation(Account, 'roles')
        .of(accountId)
        .add(premiumRole.id);
    }

    return {
      message: 'Suscripción premium activada',
      plan: plan.name,
    };
  }

  async hasActiveSubscription(accountId: number): Promise<boolean> {
    const today = new Date();
    return await this.subscriptionRepo.exist({
      where: {
        account: { id: accountId },
        status: SubscriptionStatus.ACTIVE,
        end_date: MoreThan(today),
      },
    });
  }
}
