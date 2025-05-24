import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/services/users.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { MailService } from 'src/mail/mail.service';
import { TokensService } from 'src/tokens/tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly mailService: MailService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<string> {
    const account = await this.accountsService.findByEmail(email);
    if (!account || !account.password) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const token = uuidv4();

    await this.tokensService.storeToken(email, token);
    await this.mailService.sendLoginToken(email, token);

    return 'Revise su correo para continuar el inicio de sesión';
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
  ): Promise<{ accessToken: string }> {
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
    return { accessToken };
  }
}
