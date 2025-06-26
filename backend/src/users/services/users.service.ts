/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  BadRequestException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { AlpacaBrokerService } from 'src/alpaca_broker/services/alpaca_broker.service';
import { Role } from 'src/roles-permission/entities/role.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';

@Injectable()
export class UsersService{
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private accountService: AccountsService,
    private alpacaBrokerService: AlpacaBrokerService,
    private readonly hashingProvider: HashingProvider,
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
    user.roles = [rolUsuario]; // <- importante, así queda asociado al crear

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

  // src/users/services/users.service.ts

  async findById(id: string, p0?: string[]): Promise<User | null> {
    return this.userRepository.findOne({
      where: { identity_document: String(id) },
      relations: ['roles', 'account'],
    });
  }

  async updateUserRole(id: string, roleIds: number[]) {
    const user = await this.userRepository.findOne({
      where: { identity_document: id },
      relations: ['roles'], // importante para que cargue la relación
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Busca los roles
    const roles = await this.roleRepository.findByIds(roleIds);
    user.roles = roles;
    await this.userRepository.save(user);
    return { message: 'Rol actualizado', roles: user.roles.map((r) => r.name) };
  }

  // Obtener perfil
  async getProfileCompleto(identity_document: string) {
    const user = await this.userRepository.findOne({
      where: { identity_document },
      relations: ['account'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      identity_document: user.identity_document,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.account?.email,
      phone: user.phone,
    };
  }

  async updateProfile(identity_document: string, data: UpdateProfileDto) {
    const forbiddenFields = ['first_name', 'last_name', 'identity_document'];
    for (const field of forbiddenFields) {
      if (field in UpdateProfileDto) {
        throw new BadRequestException(
          `No está permitido cambiar el campo: ${field}`,
        );
      }
    }

    const user = await this.userRepository.findOne({
      where: { identity_document },
      relations: ['account'],
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Cambia el teléfono directamente
    if (data.phone) {
      user.phone = data.phone;
      await this.userRepository.save(user);
    }

    // Cambia el email usando el servicio de cuentas
    if (data.email) {
      await this.accountService.updateEmail(user.account.id, data.email);
    }

    // Cambia la dirección si la mandaron
    if (data.address) {
      user.address = data.address;
      await this.userRepository.save(user);
    }

    // Refresca la información
    const updatedUser = await this.userRepository.findOne({
      where: { identity_document },
      relations: ['account'],
    });

    return {
      message: 'Perfil actualizado correctamente',
      email: updatedUser?.account.email,
      phone: updatedUser?.phone,
    };
  }

  // async changePassword(identity_document: string, data: ChangePasswordDto) {
  //   // Busca el usuario y la cuenta relacionada
  //   const user = await this.userRepository.findOne({
  //     where: { identity_document },
  //     relations: ['account'],
  //   });

  //   console.log('Password actual (hash en base):', user?.account.password);
  //   const hashed = await this.hashingProvider.hashPassword(data.newPassword);
  //   console.log('Nuevo hash generado:', hashed);
  //   if (user && user.account) {
  //     user.account.password = hashed;
  //     await this.accountService.updatePassword(
  //       user.account.id,
  //       user.account.password,
  //     );
  //   }

  //   if (!user || !user.account)
  //     throw new NotFoundException('Usuario no encontrado');

  //   // Compara la clave actual
  //   const passwordOk = await this.hashingProvider.comparePassword(
  //     data.currentPassword,
  //     user.account.password,
  //   );
  //   if (!passwordOk)
  //     throw new BadRequestException('La contraseña actual es incorrecta');

  //   // Hashea la nueva contraseña y actualiza
  //   user.account.password = await this.hashingProvider.hashPassword(
  //     data.newPassword,
  //   );
  //   await this.accountService.updatePassword(
  //     user.account.id,
  //     user.account.password,
  //   );
  //   console.log('Nuevo hash bcrypt:', user.account.password);
  //   return { message: 'Contraseña actualizada correctamente' };
  // }
}
