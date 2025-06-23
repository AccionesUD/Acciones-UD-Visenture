import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
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
    paymentToken: string,
  ) {
    // 1. Verifica el plan
    const plan: PremiumPlan | null = await this.premiumPlanRepo.findOne({
      where: { id: planId },
    });
    if (!plan) throw new BadRequestException('Plan no existe');

    // 2. Llama PaymentsService
    const amount = Number(plan.price);
    const pagoOk = await this.paymentsService.validateToken(
      paymentToken,
      amount,
    );
    if (!pagoOk) throw new HttpException('Pago no procesado', 402);

    // 3. Calcula fechas
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + plan.duration_days);

    // 4. Busca la cuenta completa
    const account: Account | null = await this.accountRepo.findOne({
      where: { id: accountId },
      relations: ['roles'],
    });
    if (!account) throw new BadRequestException('Cuenta no encontrada');

    // 5. Crea la suscripción
    const subscription = this.subscriptionRepo.create({
      account,
      plan,
      start_date: start,
      end_date: end,
      status: SubscriptionStatus.ACTIVE,
    });
    await this.subscriptionRepo.save(subscription);

    // 6. Asigna el rol usuario_premium si no lo tiene
    // ... después de guardar la suscripción

    const alreadyPremium =
      Array.isArray(account.roles) &&
      account.roles.some((r) => r.name === 'usuario_premium');

    console.log('¿Evaluando asignación de usuario_premium?', {
      alreadyPremium,
    });

    if (!alreadyPremium) {
      const premiumRole = await this.roleRepo.findOne({
        where: { name: 'usuario_premium' },
      });
      if (premiumRole) {
        console.log('Asignando rol usuario_premium', {
          accId: account.id,
          rolesAntes: account.roles.map((r) => r.name),
          premiumRoleId: premiumRole.id,
        });

        await this.accountRepo
          .createQueryBuilder()
          .relation(Account, 'roles')
          .of(account.id)
          .add(premiumRole.id);

        const updated = await this.accountRepo.findOne({
          where: { id: account.id },
          relations: ['roles'],
        });
        console.log(
          'Roles después:',
          updated?.roles.map((r) => r.name),
        );
      } else {
        console.log('premiumRole no encontrado en BD');
      }
    }

    return { message: 'Suscripción premium activada', plan: plan.name };
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
