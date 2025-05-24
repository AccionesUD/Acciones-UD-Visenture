import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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
}
