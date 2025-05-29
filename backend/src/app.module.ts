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
import { MarketsModule } from './markets/markets.module';

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
        autoLoadEntities: configService.get('DB_AUTOLOADENTITIES'),
        synchronize: configService.get('DB_SYNCRONIZE'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        host: configService.get('DB_HOST'),
      }),
    }),
    UsersModule,
    AccountsModule,
    AuthModule,
    MailModule,
    TokensModule,
    MarketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
