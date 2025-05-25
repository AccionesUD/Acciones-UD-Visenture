import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TokensModule } from './tokens/tokens.module';
import { PasswordResetToken } from './password-reset/entities/password-reset-token.entity';
import { User } from './users/users.entity';
import { Account } from './accounts/entities/account.entity';
import { LoginToken } from './tokens/entities/login-token.entity';
import { PasswordResetModule } from './password-reset/password-reset.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: true,
        port: 5432,
        username: 'root',
        password: 'root',
        database: 'visenture',
        host: 'localhost',
      }),
    }),
    // Type usado para pruebas
    // TypeOrmModule.forRoot({
    //   type: 'sqlite',
    //   database: ':memory:',
    //   entities: [
    //     User,
    //     Account,
    //     PasswordResetToken,
    //     LoginToken
    //   ],
    //   synchronize: true,
    //   autoLoadEntities: true,
    //   logging: true,
    // }),
    UsersModule,
    AccountsModule,
    AuthModule,
    PasswordResetModule,
    MailModule,
    TokensModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
