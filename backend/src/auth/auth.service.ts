import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/services/users.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { MailService } from 'src/mail/mail.service';
import { TokensService } from 'src/tokens/tokens.service';
import { HashingProvider } from './providers/bcrypt.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly mailService: MailService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly hashingProvider: HashingProvider
  ) {}

  async validateUser(email: string, password: string): Promise<string> {
    const account = await this.accountsService.findByEmail(email);
    if (!account || !account.password) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.hashingProvider.comparePassword(password, account.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }
    
    // Generamos un token de 6 caracteres alfanuméricos
    const token = this.generateShortToken();
    await this.tokensService.storeToken(email, token);
    await this.mailService.sendLoginToken(email, token);

    return 'Revise su correo para continuar el inicio de sesión';
  }

  /**
   * Valida el token de autenticación sin consumirlo
   * @param email Correo electrónico del usuario
   * @param token Token de autenticación a validar
   * @returns Objeto con el resultado de la validación y un mensaje
   */
  async validateLoginToken(
    email: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    // Usamos checkTokenValid que solo verifica sin consumir el token
    const isValid = await this.tokensService.checkTokenValid(email, token);

    if (!isValid) {
      return { success: false, message: 'Token inválido o expirado' };
    }

    return {
      success: true,
      message: 'Token válido, puede continuar con el login',
    };
  }  /**
   * Genera un token JWT de acceso después de verificar y consumir el token MFA
   * @param email Correo electrónico del usuario
   * @param token Token MFA para validación final
   * @returns Objeto con el token JWT de acceso
   * @throws UnauthorizedException si el token es inválido o la cuenta no existe
   */
  async generateAccessToken(
    email: string,
    token: string,
  ): Promise<{ accessToken: string }> {
    // Consumimos (validamos + eliminamos) el token
    const isValid = await this.tokensService.validateToken(email, token);
    if (!isValid) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new UnauthorizedException('Cuenta no encontrada');
    }
    
    // Definición de la estructura del payload del JWT
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
  }  async resendToken(email: string): Promise<string> {
    // Verificamos que el email corresponda a una cuenta existente
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new UnauthorizedException('Correo electrónico no encontrado');
    }    // Generamos un nuevo token de 6 caracteres
    const token = this.generateShortToken();
    
    // Almacenamos el nuevo token
    await this.tokensService.storeToken(email, token);
    // Enviamos el token por correo
    await this.mailService.sendLoginToken(email, token);
    return 'Token reenviado correctamente';
  }

  private generateShortToken(): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
  }
}
