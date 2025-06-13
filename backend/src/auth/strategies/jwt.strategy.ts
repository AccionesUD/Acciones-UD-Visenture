// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/services/users.service'; // Ajusta la ruta según tu proyecto

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
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

  async validate(payload: { sub: string; email: string }) {
    // Busca el usuario con la relación 'roles'
    const user = await this.usersService.findById(payload.sub);
    // Convierte los roles a un array de strings (nombres)
    const roles = user?.roles?.map((r) => r.name) || [];
    return {
      userId: user?.identity_document,
      email: user?.account?.email,
      roles, // <-- solo los nombres
    };
  }
}
