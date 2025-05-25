// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // obtiene el token del header
      ignoreExpiration: false,
      secretOrKey: `${configService.get('JWT_SECRET')}`, // usa la misma que en JwtModule
    });
  }

  validate(payload: { sub: string; email: string }) {
    // este objeto se inyectará en `Request.user`
    return { userId: payload.sub, email: payload.email };
  }
}
