// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ValidateTokenDto } from './dto/validate-token.dto'; // Asegúrate de que este DTO esté definido
import { UsersService } from '../users/services/users.service';
import { MailService } from 'src/mail/mail.service';
import { ApiOperation } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto'; // Añadir esta línea
import { AccountsService } from 'src/accounts/services/accounts.service';
import { ResendToken2fmadDto } from './dto/resend-token2mfa';
import { ChangePasswordDto } from 'src/users/dtos/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('Intentando login con clave:', loginDto.password);
    return await this.authService.validateUser(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('complete-login')
  async completeLogin(@Body() dto: CompleteLoginDto) {
    return await this.authService.generateAccessToken(dto.email, dto.token);
  }

  @Post('resend-token2fma')
  async resendToken2fma(@Body() resendToken2fmaDto: ResendToken2fmadDto) {
    return await this.authService.generateTokenLogin(resendToken2fmaDto.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post('validate-reset-token')
  @ApiOperation({ summary: 'Validar token de restablecimiento' })
  async validateResetToken(@Body() validateTokenDto: ValidateTokenDto) {
    return this.authService.validatePasswordResetToken(
      validateTokenDto.email,
      validateTokenDto.token,
    );
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Patch('perfil/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: import('express').Request & { user?: { userId: string } },
    @Body() body: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = req.user as { userId: string };
    return await this.authService.changePassword(user.userId, body);
  }
}
