import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  RequestTimeoutException,
} from '@nestjs/common';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';
import { MakeFundignAccountDto } from '../dtos/make-funding-account.dto';
import { AlpacaBrokerService } from 'src/alpaca_broker/services/alpaca_broker.service';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private hashingProvider: HashingProvider,
    @Inject(forwardRef(() => AlpacaBrokerService))
    private alpacaBrokerService: AlpacaBrokerService
  ) { }

  async createAccount(createAccountDto: CreateAccountDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createAccountDto.password,
    );
    const account = this.accountRepository.create({
      ...createAccountDto,
      password: hashedPassword,
    });

    try {
      await this.accountRepository.save(account);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException('Error creando cuenta', HttpStatus.BAD_REQUEST);
    }

  }

  async fundingAccount(makeFundignAccountDto: MakeFundignAccountDto) { 
    return this.alpacaBrokerService.makeFundignAccount(makeFundignAccountDto)
  }


  async checkExistenceAccount(email?: string, accountId?: number, accountIdAlpaca?: string) {
    let findAccount: null | Account = null;
    try {
      if (email) {
        findAccount = await this.accountRepository.findOneBy({ email });
      } else if (accountId) {
        findAccount = await this.accountRepository.findOneBy({ id: accountId });
      } else if (accountIdAlpaca) {
        findAccount = await this.accountRepository.findOneBy({ alpaca_account_id: accountIdAlpaca });
      }
      return findAccount;
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {
        description: 'Se presento un error en la operacion, intente luego',
      });
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOneBy({ email });
  }

  async updatePassword(accountId: number, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashingProvider.hashPassword(newPassword);

    try {
      await this.accountRepository.update(accountId, {
        password: hashedPassword,
        last_access: new Date(), // Actualizar último acceso
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException(
        'Error actualizando contraseña',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // accounts.service.ts
  async findByUserId(accountId: number): Promise<Account | null> {

    return this.accountRepository.findOne({
      where: { id: accountId }, // Busca por el ID autoincremental de la cuenta
    });
  }
}
