// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicia el proceso de login generando un token MFA
   * @param loginDto Objeto con credenciales del usuario
   * @returns Mensaje indicando que se envió el token al correo
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return { message: 'Token generado, verifique su correo', token };
  }

  /**
   * Reenvía un token MFA al correo del usuario
   * @param email Correo electrónico del usuario
   * @returns Resultado de la operación con mensaje
   */
  @Post('resend-token')
  async resendToken(@Body() { email }: { email: string }) {
    try {
      const message = await this.authService.resendToken(email);
      return { success: true, message };
    } catch (error) {
      if (error?.response?.message) {
        return { success: false, message: error.response.message };
      }
      throw error;
    }
  }

  /**
   * Valida un token MFA sin consumirlo
   * @param dto Objeto con email y token para validación
   * @returns Resultado de la validación con mensaje
   */
  @Post('validate-token')
  async validateToken(@Body() dto: ValidateTokenDto) {
    return await this.authService.validateLoginToken(dto.email, dto.token);
  }

  /**
   * Completa el proceso de login generando un token de acceso JWT
   * @param dto Objeto con email y token MFA verificado
   * @returns Token JWT de acceso
   */
  @Post('complete-login')
  async completeLogin(@Body() dto: CompleteLoginDto) {
    try {
      const result = await this.authService.generateAccessToken(dto.email, dto.token);
      return result;
    } catch (error) {
      throw error;
    }
  }
}
