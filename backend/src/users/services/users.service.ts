import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { UserPasswordReset } from 'src/password-reset/entities/users-passwordReset.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private accountService: AccountsService,
    @InjectRepository(UserPasswordReset)
    private readonly userPasswordResetRepository: Repository<UserPasswordReset>,) { }

  async createUser(createUserDto: CreateUserDto) {
    if (
      (await this.checkExistenceUser(createUserDto.identity_document)) ||
      (await this.accountService.checkExistenceAccount(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        createUserDto.account.email,
      ))
    ) {
      throw new HttpException('El usuario ya existe', HttpStatus.FORBIDDEN);
    }
    createUserDto.account.identity_document = createUserDto.identity_document;
    try {
      const user = this.userRepository.create(createUserDto);
      await this.userRepository.save(user);
      await this.accountService.createAccount(createUserDto.account);
      return user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new HttpException('Registro fallido', HttpStatus.BAD_REQUEST);
    }
  }

  async checkExistenceUser(id: string) {
    const userFind = await this.userRepository.findOneBy({
      identity_document: id,
    });
    if (userFind == null) {
      return false;
    }
    return true;
  }

}
