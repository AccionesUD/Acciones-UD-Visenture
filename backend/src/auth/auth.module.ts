import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { MailModule } from 'src/mail/mail.module';
import { TokensModule } from 'src/tokens/tokens.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    AccountsModule,
    MailModule,
    TokensModule,
    JwtModule.register({
      secret: 'your_jwt_secret_key', // Cambia esto por una clave secreta segura
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
