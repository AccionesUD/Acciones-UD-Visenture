/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { AlpacaBrokerService } from 'src/alpaca_broker/services/alpaca_broker.service';
import { Role } from 'src/roles-permission/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private accountService: AccountsService,
    private alpacaBrokerService: AlpacaBrokerService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.checkExistenceUser(
      createUserDto.identity_document,
    );
    const existingAccount = await this.accountService.checkExistenceAccount(
      createUserDto.account.email,
    );
    if (existingUser) {
      throw new HttpException('El usuario ya existe', HttpStatus.CONFLICT);
    }
    if (existingAccount) {
      throw new HttpException(
        'El email ya esta registrado',
        HttpStatus.CONFLICT,
      );
    }

    // Crea la entidad usuario
    const user = this.userRepository.create(createUserDto);

    // --> ASIGNAR EL ROL POR DEFECTO AQUÍ
    const rolUsuario = await this.roleRepository.findOne({
      where: { name: 'usuario' },
    });
    if (!rolUsuario) {
      throw new HttpException(
        'El rol por defecto no existe',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    //user.roles = [rolUsuario]; // <- importante, así queda asociado al crear

    // -- resto de lógica (asociar account, crear cuenta Alpaca, etc.) --
    const accountAlpca: string =
      await this.alpacaBrokerService.createAccountAlpaca(createUserDto);
    createUserDto.account = {
      ...createUserDto.account,
      user: user,
      alpaca_account_id: accountAlpca,
    };

    try {
      await this.userRepository.save(user); // <-- ya se guarda con el rol por defecto
      await this.accountService.createAccount(createUserDto.account);
      return {
        success: true,
        message: 'Usuario registrado correctamente',
      };
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {
        description: 'Se presento un error en la operacion, intente luego',
      });
    }
  }

  async checkExistenceUser(id: string) {
    try {
      const userFind = await this.userRepository.findOneBy({
        identity_document: id,
      });
      return userFind;
    } catch (error) {
      throw new RequestTimeoutException('Error en operacion en la BD', {
        description: 'Se presento un error en la operacion, intente luego',
      });
    }
  }

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { identity_document: String(id) },
      relations: ['roles', 'account'],
    });
  }

  // async updateUserRole(id: string, roleIds: number[]) {
  //   const user = await this.userRepository.findOne({
  //     where: { identity_document: id },
  //     relations: ['roles'], // importante para que cargue la relación
  //   });
  //   if (!user) throw new NotFoundException('Usuario no encontrado');

  //   // Busca los roles
  //   const roles = await this.roleRepository.findByIds(roleIds);
  //   user.roles = roles;
  //   await this.userRepository.save(user);
  //   return { message: 'Rol actualizado', roles: user.roles.map((r) => r.name) };
  // }
}
