// src/tokens/tokens.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginToken } from './entities/login-token.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(LoginToken)
    private loginTokenRepository: Repository<LoginToken>,
    private configService: ConfigService
  ) {}

  async storeToken(email: string, token: string): Promise<void> {
    const expirationMinutes = this.configService.get('2MFA_EXPIRATION_TOKEN');
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const loginToken = this.loginTokenRepository.create({
      email,
      token,
      expiresAt,
    });

    try {
      await this.loginTokenRepository.save(loginToken);
    } catch(error){
      
    }
   
  }

  // src/tokens/tokens.service.ts

  async validateToken(email: string, token: string): Promise<boolean> {
    const loginToken = await this.loginTokenRepository.findOne({
      where: { email, token },
    });

    if (!loginToken) return false;

    const now = new Date();
    if (loginToken.expiresAt < now) {
      await this.loginTokenRepository.delete({ id: loginToken.id }); // Eliminar el token expirado
      return false;
    }

    // Si el token es válido y no ha expirado, lo eliminamos
    // para que no pueda ser reutilizado
    await this.loginTokenRepository.delete({ id: loginToken.id });
    return true;
  }
}
