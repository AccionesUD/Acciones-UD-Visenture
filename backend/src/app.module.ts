import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TokensModule } from './tokens/tokens.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarketsModule } from './alpaca_trading/alpaca-trading.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AlpacaBrokerModule } from './alpaca_broker/alpaca_broker.module';
import { StocksController } from './stocks/stocks.controller';
import { StocksModule } from './stocks/stocks.module';
import { OrdersModule } from './orders/orders.module';
import { SharesModule } from './shares/shares.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BriefcaseModule } from './briefcases/briefcases.module';
import { RolesPermissionModule } from './roles-permission/roles-permission.module';
import { AlpacaMarketService } from './alpaca_market/services/alpaca_market.service';
import { AlpacaMarketModule } from './alpaca_market/alpaca_market.module';
import { EventsAlpacaModule } from './events-alpaca/events-alpaca.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdvisorModule } from './advisor/advisor.module';
import { PremiumModule } from './premium/premium.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { url } from 'inspector';
import { PreferencesModule } from './preferences/preferences.module';
import { MarketNotificationsModule } from './notifications/market-notification/market-notifications.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminAnalyticsModule } from './admin-analytics/admin-analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false
          }
        },
        autoLoadEntities: configService.get('DB_AUTOLOADENTITIES') === 'true',
        synchronize: configService.get('DB_SYNCRONIZE') === 'true',
        url: configService.get('DB_URL')
      }),
    }),
    ScheduleModule.forRoot(), 
    CacheModule.register({ ttl: 60 }), //sirve para retrasar las peticiones realizadas a la api con intervalos de un minuto
    UsersModule,
    AccountsModule,
    AdminAnalyticsModule,
    AuthModule,
    MailModule,
    TokensModule,
    MarketsModule,
    AlpacaBrokerModule,
    OrdersModule,
    SharesModule,
    BriefcaseModule,
    StocksModule,
    TransactionsModule,
    RolesPermissionModule,
    AlpacaMarketModule,
    EventsAlpacaModule,
    NotificationsModule,
    AdvisorModule,
    PremiumModule,
    SubscriptionsModule,
    PaymentsModule,
    PreferencesModule,
    MarketNotificationsModule,
    PriceAlertsModule,
  ],
  controllers: [AppController, StocksController],
  providers: [AppService],
})
export class AppModule {}