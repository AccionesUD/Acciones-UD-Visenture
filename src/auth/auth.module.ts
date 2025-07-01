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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Role } from 'src/roles-permission/entities/role.entity';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UsersModule), // Usar forwardRef para evitar dependencia circular
    forwardRef(() => AccountsModule), // Usar forwardRef para evitar dependencia circular,
    MailModule,
    AlpacaBrokerModule,
    TokensModule,
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, HashingProvider],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
