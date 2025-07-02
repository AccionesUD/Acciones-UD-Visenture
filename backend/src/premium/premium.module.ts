import { Module } from '@nestjs/common';
import { PremiumService } from './services/premium.service';
import { PremiumController } from './controllers/premium.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PremiumPlan } from './entities/premium-plan.entity';
import { PremiumPlanSeedService } from './services/premium-plan-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([PremiumPlan])],
  providers: [PremiumService, PremiumPlanSeedService],
  controllers: [PremiumController],
  exports: [PremiumService],
})
export class PremiumModule {}
