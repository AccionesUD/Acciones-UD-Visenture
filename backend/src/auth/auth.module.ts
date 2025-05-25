import { Module, forwardRef } from '@nestjs/common';
import { HashingProvider } from './providers/bcrypt.provider';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { MailModule } from 'src/mail/mail.module';
import { TokensModule } from 'src/tokens/tokens.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordResetModule } from 'src/password-reset/password-reset.module';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Usar forwardRef para evitar dependencia circular
    forwardRef(() => AccountsModule), // Usar forwardRef para evitar dependencia circular
    forwardRef(() => PasswordResetModule),
    MailModule,
    TokensModule,
    JwtModule.register({
      secret: '123456', // Cambia esto por una clave secreta segura
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, HashingProvider],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
