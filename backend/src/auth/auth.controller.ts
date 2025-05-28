// src/auth/auth.controller.ts
import { Controller, Post, Body, NotFoundException, UnauthorizedException, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UsersService } from '../users/services/users.service';
import { MailService } from 'src/mail/mail.service';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto'; // Añadir esta línea
import * as bcrypt from 'bcrypt';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { ResendToken2fmadDto } from './dto/resend-token2mfa';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountsService: AccountsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.validateUser(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('complete-login')
  async completeLogin(@Body() dto: CompleteLoginDto) {
    return await this.authService.generateAccessToken(dto.email, dto.token);
  }

  @Post('resend-token2fma')
  async resendToken2fma(@Body() resendToken2fmaDto: ResendToken2fmadDto){
    return await this.authService.generateTokenLogin(resendToken2fmaDto.email)
  }
}
