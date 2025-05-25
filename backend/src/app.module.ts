import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TokensModule } from './tokens/tokens.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles globalmente
      envFilePath: '.env',
    }),
    UsersModule,
    AccountsModule,    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        autoLoadEntities: process.env.DB_AUTOLOADENTITIES === 'true',
        synchronize: process.env.DB_SYNCRONIZE === 'true',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'visenture_db',
        host: process.env.DB_HOST || 'localhost',
      }),
    }),
    AuthModule,
    MailModule,
    TokensModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
