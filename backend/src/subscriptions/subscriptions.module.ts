import { Module } from '@nestjs/common';
import { SubscriptionsService } from './services/subscriptions.service';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { Account } from 'src/accounts/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PremiumPlan } from 'src/premium/entities/premium-plan.entity';
import { SubscriptionsSeedService } from 'src/accounts/services/subscriptions-seed.service';
import { Role } from 'src/roles-permission/entities/role.entity';
import { PaymentsService } from 'src/payments/services/payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Account, PremiumPlan, Role]),
  ],
  providers: [SubscriptionsService, SubscriptionsSeedService, PaymentsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
