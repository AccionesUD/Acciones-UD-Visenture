/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { typesToken } from 'src/tokens/enums/tokenType.enum';
import { UsersService } from '../users/services/users.service';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { MailService } from 'src/mail/mail.service';
import { TokensService } from 'src/tokens/tokens.service';
import { HashingProvider } from './providers/bcrypt.provider';
import { GenerateToken2MFA } from 'src/tokens/services/generate-token.provider';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from 'src/users/dtos/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly mailService: MailService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly hashingProvider: HashingProvider,
    private readonly generateToken2MFA: GenerateToken2MFA,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const account = await this.accountsService.findByEmail(loginDto.email);
    console.log('Email:', loginDto.email, 'Hash en base:', account?.password); // <---
    console.log('Intentando login con clave:', loginDto.password); // <---
    if (!account) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.hashingProvider.comparePassword(
      loginDto.password,
      account.password,
    );
    console.log('¿Password válido?', isPasswordValid);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    return await this.generateTokenLogin(loginDto.email);
  }

  async generateTokenLogin(email: string) {
    const token = this.generateToken2MFA.generateToken();
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new UnauthorizedException('User not found');
    }
    await this.tokensService.storeToken(email, token, typesToken.LOGIN2FMA);
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
    const isValid = await this.tokensService.validateToken(
      email,
      token,
      typesToken.LOGIN2FMA,
    );

    if (!isValid) {
      return { success: false, message: 'Token inválido o expirado' };
    }

    return {
      success: true,
      message: 'Token válido, puede continuar con el login',
    };
  }

  async generateAccessToken(email: string, token: string) {
    const isValid = await this.tokensService.validateToken(
      email,
      token,
      typesToken.LOGIN2FMA,
    );
    if (!isValid) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const account =
      await this.accountsService.findByEmailWithUserAndRoles(email);
    if (!account) throw new UnauthorizedException('Cuenta no encontrada');

    // --- Intentar buscar el usuario y sus roles ---
    let roles: string[] = [];
    try {
      if (account.identity_document && account.user.identity_document) {
        if (account?.user?.roles) {
          roles = account.user.roles.map((r) => r.name);
        }
      }
    } catch (err) {
      // Si falla, simplemente deja roles vacío (no rompas el flujo)
      roles = [];
    }

    // --- Armado del payload ---
    const payload = {
      sub: account.user.identity_document, // <-- Ahora el sub es el identity_document (string)
      email: account.email,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: accessToken,
    };
  }

  async requestPasswordReset(email: string) {
    //  const account = await this.accountsService.findByEmail(email);
    // if (!account) {
    //  throw new UnauthorizedException('No existe una cuenta con ese correo electrónico');
    //}
    const token = this.generateToken2MFA.generateToken();
    await this.tokensService.storeToken(
      email,
      token,
      typesToken.RECOVER_PASSWORD,
    );
    await this.mailService.sendPasswordResetEmail(email, token);

    return { message: 'Correo de recuperación enviado exitosamente' };
  }

  async validatePasswordResetToken(
    email: string,
    token: string,
  ): Promise<{ valid: boolean }> {
    const isValid = await this.tokensService.justValidateToken(
      email,
      token,
      typesToken.RECOVER_PASSWORD,
    );
    if (!isValid) {
      throw new BadRequestException('Token inválido o expirado');
    }
    return { valid: true };
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    const isValid = await this.tokensService.validateToken(
      email,
      token,
      typesToken.RECOVER_PASSWORD,
    );
    if (!isValid) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    try {
      await this.accountsService.updatePassword(account.id, newPassword);
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      throw new RequestTimeoutException('Error al actualizar la contraseña', {
        description:
          'Se presentó un error al actualizar la contraseña, intente más tarde.',
      });
    }
  }

  // auth.service.ts
  async changePassword(identity_document: string, data: ChangePasswordDto) {
    // Busca el usuario y su cuenta (con join en relations)
    const user = await this.usersService.findById(identity_document, [
      'account',
    ]);
    if (!user || !user.account)
      throw new NotFoundException('Usuario no encontrado');

    // Valida la contraseña actual
    const passwordOk = await this.hashingProvider.comparePassword(
      data.currentPassword,
      user.account.password,
    );
    if (!passwordOk)
      throw new BadRequestException('La contraseña actual es incorrecta');
    console.log(data.newPassword);
    // Hashea la nueva clave y actualiza
    //const newHash = await this.hashingProvider.hashPassword(data.newPassword);
    await this.accountsService.updatePassword(
      user.account.id,
      data.newPassword,
    );

    return { message: 'Contraseña actualizada correctamente' };
  }
}
