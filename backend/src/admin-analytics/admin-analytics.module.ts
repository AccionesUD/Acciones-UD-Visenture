import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './services/admin-analytics/admin-analytics.service';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { OrdersModule } from 'src/orders/orders.module';
import { SharesModule } from 'src/shares/shares.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { BriefcaseModule } from 'src/briefcases/briefcases.module';

@Module({
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService],
  imports: [TransactionsModule, OrdersModule, SharesModule, AccountsModule, BriefcaseModule]
})
export class AdminAnalyticsModule {}
