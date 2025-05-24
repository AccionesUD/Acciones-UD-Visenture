import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private hashingProvider: HashingProvider,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const hashedPassword = await bcrypt.hash(createAccountDto.password, 10);
    const account = this.accountRepository.create({
      ...createAccountDto,
      password: hashedPassword,
    });

    try {
      await this.accountRepository.save(account);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException('Error creating account', HttpStatus.BAD_REQUEST);
    }
  }

  async checkExistenceAccount(email: string) {
    const findAccount = await this.accountRepository.findOneBy({ email });
    if (findAccount == null) {
      return false;
    }
    return true;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: {
        email,
      },
    });
  }
}
