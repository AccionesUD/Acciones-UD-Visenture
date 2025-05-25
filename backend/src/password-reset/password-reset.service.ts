// src/password-reset/password-reset.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/users.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
  ) {}

  async createToken(email: string): Promise<string> {
    const token = this.jwtService.sign(
      { email },
      { expiresIn: '1h', secret: '123456' },
    );
    
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    await this.tokenRepository.save({
      token: hashedToken,
      email,
      expiresAt,
      used: false,
    });

    return token;
  }

  async validateToken(token: string, email: string): Promise<boolean> {
    const storedToken = await this.tokenRepository.findOne({
      where: { email, used: false },
      order: { expiresAt: 'DESC' },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return false;
    }

    return bcrypt.compare(token, storedToken.token);
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.tokenRepository.update(
      { token },
      { used: true },
    );
  }
}