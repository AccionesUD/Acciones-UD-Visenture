import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private hashingProvider: HashingProvider,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    console.log(createAccountDto);
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

  async checkExistenceAccount(email: string) {
    try {
      const findAccount = await this.accountRepository.findOneBy({ email });
      return findAccount;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {
        description: 'Se presento un error en la operacion, intente luego',
      });
    }
  }

  // En accounts.service.ts
  async findByEmail(email: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { email },
      relations: ['user'],
    });
    if (!account) {
      throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
    }
    return account;
  }

  async findByEmailWithUserAndRoles(email: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { email },
      relations: ['user', 'user.roles'],
    });
    if (!account) {
      throw new HttpException('Cuenta no encontrada', HttpStatus.NOT_FOUND);
    }
    return account;
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

    console.log('Actualizando password en la base para account id:', accountId);
    console.log('Nuevo password:', newPassword);
    console.log('Nuevo hash a guardar:', hashedPassword);
  }
  // accounts.service.ts
  async findByUserId(accountId: number): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { id: accountId }, // Busca por el ID autoincremental de la cuenta
    });
  }

  async updateEmail(accountId: number, newEmail: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    account.email = newEmail;
    return this.accountRepository.save(account);
  }
}
