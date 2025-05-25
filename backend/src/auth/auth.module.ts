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

@Module({
  imports: [
    forwardRef(() => UsersModule), // Usar forwardRef para evitar dependencia circular
    forwardRef(() => AccountsModule), // Usar forwardRef para evitar dependencia circular
    MailModule,
    TokensModule,    JwtModule.register({
      secret: process.env.JWT_SECRET || '123456', // Usa la variable de entorno JWT_SECRET
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, HashingProvider],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
