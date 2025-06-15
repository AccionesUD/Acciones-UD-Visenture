// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { UsersService } from 'src/users/services/users.service'; // Ajusta la ruta según tu proyecto

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: number; email: string }) {
    // Busca la cuenta con roles
    const account = await this.accountsService.findByIdWithRoles(payload.sub);
    const roles = account?.roles?.map((r) => r.name) || [];
    return {
      userId: account?.user?.identity_document,
      email: account?.email,
      roles,
    };
  }
}
