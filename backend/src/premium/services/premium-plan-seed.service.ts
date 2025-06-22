import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PremiumPlan } from '../entities/premium-plan.entity';

@Injectable()
export class PremiumPlanSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(PremiumPlan)
    private readonly premiumPlanRepo: Repository<PremiumPlan>,
  ) {}

  async onApplicationBootstrap() {
    const planes = [
      {
        name: 'básico',
        price: 9.99,
        duration_days: 30,
        description: 'Acceso básico a funciones premium',
      },
      {
        name: 'pro',
        price: 19.99,
        duration_days: 30,
        description: 'Funciones premium avanzadas',
      },
      {
        name: 'anual',
        price: 199.99,
        duration_days: 365,
        description: 'Suscripción anual a premium',
      },
    ];
    for (const plan of planes) {
      const existe = await this.premiumPlanRepo.findOne({
        where: { name: plan.name },
      });
      if (!existe) {
        await this.premiumPlanRepo.save(plan);
      }
    }
    console.log('Planes premium iniciales insertados.');
  }
}
