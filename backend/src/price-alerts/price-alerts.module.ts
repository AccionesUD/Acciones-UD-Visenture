// src/price-alerts/price-alerts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlert } from './entitites/price-alert.entity';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlertsController } from './price-alerts.controller';
import { PriceAlertsCheckerService } from './price-alerts-checker.service';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { SharesModule } from 'src/shares/shares.module';
import { MarketsModule } from 'src/alpaca_trading/alpaca-trading.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Account } from 'src/accounts/entities/account.entity';
import { Share } from 'src/shares/entities/shares.entity';
import { StocksModule } from 'src/stocks/stocks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceAlert,
      Account,
      Share
    ]),
    SubscriptionsModule,
    SharesModule,
    MarketsModule,
    NotificationsModule,
    StocksModule,
  ],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService, PriceAlertsCheckerService],
  exports: [PriceAlertsService]
})
export class PriceAlertsModule {}