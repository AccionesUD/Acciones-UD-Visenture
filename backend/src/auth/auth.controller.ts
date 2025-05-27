import { Controller, Post, Body, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetService } from 'src/password-reset/password-reset.service';
import { UsersService } from '../users/services/users.service';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AccountsService } from 'src/accounts/services/accounts.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsService: AccountsService,
    private readonly passwordResetService: PasswordResetService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return { message: 'Token generado, verifique su correo', token };
  }

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

  @Post('validate-token')
  async validateToken(@Body() dto: ValidateTokenDto) {
    return await this.authService.validateLoginToken(dto.email, dto.token);
  }

  @Post('complete-login')
    async completeLogin(@Body() dto: CompleteLoginDto) {
      return await this.authService.generateAccessToken(dto.email, dto.token);
    }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const account = await this.accountsService.findByEmail(forgotPasswordDto.email);
    
    if (!account) {
      throw new NotFoundException('No existe una cuenta con este correo electrónico');
    }

    const token = await this.passwordResetService.createToken(account.email);
    await this.mailService.sendPasswordResetEmail(account.email, token);

    return { message: 'Correo de recuperación enviado exitosamente' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const isValid = await this.passwordResetService.validateToken(
      resetPasswordDto.token,
      resetPasswordDto.email
    );

    if (!isValid) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const account = await this.accountsService.findByEmail(resetPasswordDto.email);
    
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    await this.accountsService.updatePassword(account.id, resetPasswordDto.newPassword);
    await this.passwordResetService.markTokenAsUsed(resetPasswordDto.token);

    return { 
      success: true,
      message: 'Contraseña actualizada exitosamente',
      last_access: account.last_access 
    };
  }
}