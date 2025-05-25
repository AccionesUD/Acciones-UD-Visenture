// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // obtiene el token del header
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '123456', // usa la variable de entorno JWT_SECRET
    });
  }

  validate(payload: { sub: string; email: string }) {
    // este objeto se inyectará en `Request.user`
    return { userId: payload.sub, email: payload.email };
  }
}
