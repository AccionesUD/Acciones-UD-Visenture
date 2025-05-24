// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return { message: 'Token generado, verifique su correo', token };
  }

  @Post('validate-token')
  async validateToken(@Body() dto: ValidateTokenDto) {
    return await this.authService.validateLoginToken(dto.email, dto.token);
  }

  @Post('complete-login')
  async completeLogin(@Body() dto: CompleteLoginDto) {
    return await this.authService.generateAccessToken(dto.email, dto.token);
  }
}
