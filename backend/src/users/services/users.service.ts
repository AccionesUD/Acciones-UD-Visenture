import { HttpException, HttpStatus, Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entitiy';
import { IsNull, Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { AccountsService } from 'src/accounts/services/accounts.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private accountService: AccountsService,
  ) { }

  async createUser(createUserDto: CreateUserDto) {

    const existingUser = await this.checkExistenceUser(createUserDto.identity_document)
    const existingAccount = await this.accountService.checkExistenceAccount(createUserDto.account.email)
    if (existingUser) {
      throw new HttpException('El usuario ya existe', HttpStatus.CONFLICT);
    }
    if (existingAccount) {
      throw new HttpException('El email ya esta registrado', HttpStatus.CONFLICT);
    }

    createUserDto.account.identity_document = createUserDto.identity_document;
    const user = this.userRepository.create(createUserDto)
    try {
      await this.userRepository.save(user);
      await this.accountService.createAccount(createUserDto.account);
      return {
        success: true,
        message: 'Usuario registrado correctamente',
      };

    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', { description: 'Se presento un error en la operacion, intente luego' });
    }
  }

  async checkExistenceUser(id: string) {
    try {
      const userFind = await this.userRepository.findOneBy({
        identity_document: id,
      });
      return userFind
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', { description: 'Se presento un error en la operacion, intente luego' });
    }

  }
}
