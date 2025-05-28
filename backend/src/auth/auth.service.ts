import { Injectable, RequestTimeoutException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/services/users.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { MailService } from 'src/mail/mail.service';
import { TokensService } from 'src/tokens/tokens.service';
import { HashingProvider } from './providers/bcrypt.provider';
import { GenerateToken2MFA } from 'src/tokens/services/generate-token.provider';
import { ResendToken2fmadDto } from './dto/resend-token2mfa';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly mailService: MailService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly hashingProvider: HashingProvider,
    private readonly generateToken2MFA: GenerateToken2MFA
  ) { }

  async validateUser(loginDto: LoginDto){
    const account = await this.accountsService.findByEmail(loginDto.email);
    if (!account) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.hashingProvider.comparePassword(loginDto.password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    return await this.generateTokenLogin(loginDto.email)
   
  
  }

  async generateTokenLogin(email: string) {
    const token = this.generateToken2MFA.generateToken()
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new UnauthorizedException('User not found');
    }
    await this.tokensService.storeToken(email, token);
    await this.mailService.sendLoginToken(email, token);
    return {
      success: true,
      message: 'Token generado y enviado con exito',
    };
  }

  // src/auth/auth.service.ts

  async validateLoginToken(
    email: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    const isValid = await this.tokensService.validateToken(email, token);

    if (!isValid) {
      return { success: false, message: 'Token inválido o expirado' };
    }

    return {
      success: true,
      message: 'Token válido, puede continuar con el login',
    };
  }

  async generateAccessToken(
    email: string,
    token: string,
  ){
    const isValid = await this.tokensService.validateToken(email, token);
    if (!isValid) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new UnauthorizedException('Cuenta no encontrada');
    }
    // Aquí definimos la estructura del payload del JWT
    interface JwtPayload {
      sub: number;
      email: string;
    }

    const payload: JwtPayload = {
      sub: account.id,
      email: account.email,
    };

    const accessToken = this.jwtService.sign(payload);
    return {
      success: true,
      message: accessToken,
    };
  }
}
