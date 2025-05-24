// src/tokens/tokens.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginToken } from './entities/login-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(LoginToken)
    private loginTokenRepository: Repository<LoginToken>,
  ) {}

  async storeToken(email: string, token: string): Promise<void> {
    const expirationMinutes = 10;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const loginToken = this.loginTokenRepository.create({
      email,
      token,
      expiresAt,
    });

    await this.loginTokenRepository.save(loginToken);
  }

  // src/tokens/tokens.service.ts

  async validateToken(email: string, token: string): Promise<boolean> {
    const loginToken = await this.loginTokenRepository.findOne({
      where: { email, token },
    });

    if (!loginToken) return false;

    const now = new Date();
    if (loginToken.expiresAt < now) return false;

    return true;
  }
}
