// src/tokens/tokens.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginToken } from './entities/login-token.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokensService {  // Límites para reenvío de token
  private readonly MAX_RESEND_COUNT = parseInt(process.env.MAX_TOKEN_RESEND || '5');
  private readonly RESEND_COOLDOWN_MINUTES = parseInt(process.env.RESEND_COOLDOWN_MINUTES || '15');

  constructor(
    @InjectRepository(LoginToken)
    private loginTokenRepository: Repository<LoginToken>,
    private configService: ConfigService
  ) {}

  async storeToken(email: string, token: string): Promise<void> {
    const expirationMinutes = this.configService.get('2MFA_EXPIRATION_TOKEN');
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Buscar tokens existentes para este email
    const existingTokens = await this.loginTokenRepository.find({
      where: { email },
    });

    // Si hay tokens existentes, incrementamos el contador de reenvíos
    let resendCount = 0;
    let lastResendAt: Date | undefined = undefined;
    
    if (existingTokens.length > 0) {
      // Usamos el contador más alto encontrado
      resendCount = Math.max(...existingTokens.map(t => t.resendCount)) + 1;
      lastResendAt = new Date();
      
      // Eliminamos los tokens anteriores
      await this.loginTokenRepository.remove(existingTokens);
    }

    const loginToken = this.loginTokenRepository.create({
      email,
      token,
      expiresAt,
      resendCount,
      lastResendAt,
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

    if (!loginToken) {
      return false;
    }

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

  /**
   * Programa una limpieza periódica de tokens expirados
   */
  private scheduleTokenCleanup(): void {
    const cleanupInterval = 30 * 60 * 1000; // 30 minutos en milisegundos
    
    setInterval(async () => {      try {
        await this.cleanupExpiredTokens();
      } catch (error) {
        // Registramos el error silenciosamente - esto es una tarea de mantenimiento programada
      }
    }, cleanupInterval);
      // También limpiamos al iniciar el servicio
    this.cleanupExpiredTokens().catch(error => {
      // Registramos el error silenciosamente - esto es una tarea de mantenimiento inicial
    });
  }
  /**
   * Elimina todos los tokens expirados de la base de datos.
   * Este método se ejecuta periódicamente para mantener limpia la base de datos.
   * 
   * @returns El número de tokens expirados que fueron eliminados
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    
    const result = await this.loginTokenRepository.delete({
      expiresAt: LessThan(now)
    });
    
    const deletedCount = result.affected || 0;
    return deletedCount;
  }
}
