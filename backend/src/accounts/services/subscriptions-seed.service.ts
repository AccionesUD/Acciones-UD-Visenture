// src/subscriptions/subscriptions-seed.service.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscriptions/entities/subscription.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { PremiumPlan } from 'src/premium/entities/premium-plan.entity';

@Injectable()
export class SubscriptionsSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(PremiumPlan)
    private readonly planRepo: Repository<PremiumPlan>,
  ) {}

  async onApplicationBootstrap() {
    // Obtén algunas cuentas y planes
    const accounts = await this.accountRepo.find({ take: 2 });
    const [acc1, acc2] = accounts;
    const [planBasico, planPro] = await this.planRepo.find({
      where: [{ name: 'básico' }, { name: 'pro' }],
    });

    if (acc1 && planBasico) {
      const sub = this.subRepo.create({
        account: acc1,
        plan: planBasico,
        start_date: new Date(),
        end_date: null,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subRepo.save(sub);
    }

    if (acc2 && planPro) {
      const sub = this.subRepo.create({
        account: acc2,
        plan: planPro,
        start_date: new Date(),
        end_date: new Date('2025-12-31'),
        status: SubscriptionStatus.CANCELLED,
      });
      await this.subRepo.save(sub);
    }

    console.log('Suscripciones de ejemplo creadas.');
  }
}
