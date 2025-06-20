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
import { AssetsModule } from './assets/assets.module';
import { StocksController } from './stocks/stocks.controller';
import { StocksModule } from './stocks/stocks.module';
import { OrdersModule } from './orders/orders.module';
import { SharesModule } from './shares/shares.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BriefcaseModule } from './briefcases/briefcases.module';
import { RolesPermissionModule } from './roles-permission/roles-permission.module';
import { PremiumModule } from './premium/premium.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
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
        autoLoadEntities: configService.get('DB_AUTOLOADENTITIES') === 'true',
        synchronize: configService.get('DB_SYNCRONIZE') === 'true',
        port: configService.get('DB_PORT', 10),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        host: configService.get('DB_HOST'),
      }),
    }),
    CacheModule.register({ ttl: 60 }), //sirve para retrasar las peticiones realizadas a la api con intervalos de un minuto
    UsersModule,
    AccountsModule,
    AuthModule,
    MailModule,
    TokensModule,
    MarketsModule,
    AlpacaBrokerModule,
    StocksModule,
    AssetsModule,
    OrdersModule,
    SharesModule,
    BriefcaseModule,
    StocksModule,
    TransactionsModule,
    RolesPermissionModule,
    PremiumModule,
    SubscriptionsModule,
  ],
  controllers: [AppController, StocksController],
  providers: [AppService],
})
export class AppModule {}
