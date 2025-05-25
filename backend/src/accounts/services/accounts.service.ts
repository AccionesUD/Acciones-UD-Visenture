import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { HttpException, HttpStatus, RequestTimeoutException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';
import { find } from 'rxjs';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private hashingProvider: HashingProvider,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(createAccountDto.password);
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

  async checkExistenceAccount(email: string) {
    try {
      const findAccount = await this.accountRepository.findOneBy({ email });
      return findAccount
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {description: 'Se presento un error en la operacion, intente luego'})
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOneBy({email})
  }
}
