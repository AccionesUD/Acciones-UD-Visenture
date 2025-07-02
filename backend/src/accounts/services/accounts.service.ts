/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAccountDto } from '../dtos/create-account.dto';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingProvider } from 'src/auth/providers/bcrypt.provider';
import { MakeFundignAccountDto } from '../dtos/make-funding-account.dto';
import { AlpacaBrokerService } from 'src/alpaca_broker/services/alpaca_broker.service';
import { TransactionsService } from 'src/transactions/services/transaction.service';
import { OrdersService } from 'src/orders/providers/orders.service';
import { Role } from 'src/roles-permission/entities/role.entity';
import { PreferencesService } from 'src/preferences/preferences.service';
import { UpdateUserByAdminDto } from '../dtos/update-user-by-admin.dto';
import { UpdateUserByAdminResponse } from '../dtos/update-user-by-admin-response.dto';

export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private hashingProvider: HashingProvider,
    @Inject(forwardRef(() => AlpacaBrokerService))
    private alpacaBrokerService: AlpacaBrokerService,
    private readonly preferencesService: PreferencesService,
    private transactionService: TransactionsService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto) {
    const hashedPassword = await this.hashingProvider.hashPassword(
      createAccountDto.password,
    );

    // Busca el rol por defecto "usuario"
    const rolUsuario = await this.roleRepository.findOne({
      where: { name: 'usuario' },
    });

    if (!rolUsuario) {
      throw new HttpException(
        'Rol por defecto "usuario" no encontrado',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Crea la cuenta con el rol asociado
    const account = this.accountRepository.create({
      ...createAccountDto,
      password: hashedPassword,
      roles: [rolUsuario], // <-- Aquí se asigna el rol
    });

    try {
      const savedAccount = await this.accountRepository.save(account);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      
      // Crear preferencias por defecto (incluyendo mailing)
      savedAccount.preference = await this.preferencesService.createDefaultPreferences(savedAccount);

      // Guardar cuenta con preferencias
      return await this.accountRepository.save(savedAccount);
      return savedAccount

    } catch (error) {
      throw new HttpException('Error creando cuenta', HttpStatus.BAD_REQUEST);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fundingAccount(
    makeFundignAccountDto: MakeFundignAccountDto,
    idAccount: number,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    makeFundignAccountDto = {
      ...makeFundignAccountDto,
      idAccount: idAccount,
    };
    return this.alpacaBrokerService.makeFundignAccount(makeFundignAccountDto);
  }

  async getBalanceAccount(accountId: number) {
    return this.transactionService.calculateCurrentBalance(accountId);
  }


  async getTransactions(accountId: number){
    return this.transactionService.getAllTransactions(accountId)
  }

  async getOrdersAccount(accountId: number){
    return this.ordersService.listOrderAccount(accountId)
    
  }
   
  async checkExistenceAccount(
    email?: string,
    accountId?: number,
    accountIdAlpaca?: string,
  ) {
    let findAccount: null | Account = null;
    try {
      if (email) {
        findAccount = await this.accountRepository.findOneBy({ email });
      } else if (accountId) {
        findAccount = await this.accountRepository.findOneBy({ id: accountId });
      } else if (accountIdAlpaca) {
        findAccount = await this.accountRepository.findOneBy({
          alpaca_account_id: accountIdAlpaca,
        });
      }
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
      relations: ['user', 'roles'],
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

  // Encuentra cuenta con sus roles
  async findByIdWithRoles(id: number): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  // Actualiza los roles de la cuenta
  async updateAccountRoles(
    id: number,
    roleIds: number[],
  ): Promise<{ message: string; roles: string[] }> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    // ¡No olvides tener roleRepository inyectado!
    const roles = await this.roleRepository.findByIds(roleIds);
    account.roles = roles;
    await this.accountRepository.save(account);
    return { message: 'Roles actualizados', roles: roles.map((r) => r.name) };
  }

  async updateEmail(accountId: number, newEmail: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    account.email = newEmail;
    return this.accountRepository.save(account);
  }

  //obtener todo de un usuario:

  async findAllWithRoles(): Promise<
    {
      accountId: number; // <--- Nuevo campo agregado
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: string[];
    }[]
  > {
    // Trae todas las cuentas con su user y sus roles
    const accounts = await this.accountRepository.find({
      relations: ['user', 'roles'],
    });

    // Mapear al formato deseado, incluyendo accountId
    return accounts.map((acc) => ({
      accountId: acc.id, // <--- Nuevo campo aquí
      userId: acc.user.identity_document,
      firstName: acc.user.first_name,
      lastName: acc.user.last_name,
      email: acc.email,
      roles: acc.roles.map((r) => r.name),
    }));
  }

  async updateUserByAdmin(
    dto: UpdateUserByAdminDto,
  ): Promise<UpdateUserByAdminResponse> {
    // Busca la cuenta
    const account = await this.accountRepository.findOne({
      where: { id: dto.accountId },
      relations: ['user', 'roles'],
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    // Actualiza datos en tabla user (si aplica)
    if (dto.firstName) account.user.first_name = dto.firstName;
    if (dto.lastName) account.user.last_name = dto.lastName;
    if (dto.userId) account.user.identity_document = dto.userId;

    await this.accountRepository.manager.save(account.user);

    // Actualiza datos en tabla account
    if (dto.email) account.email = dto.email;

    // Actualiza roles (por nombre)
    if (dto.roles && dto.roles.length > 0) {
      const roles = await this.roleRepository.find({
        where: dto.roles.map((name) => ({ name })),
      });
      account.roles = roles;
    }

    await this.accountRepository.save(account);

    // Generar un nuevo token con los datos actualizados
    const payload = {
      sub: account.id,
      email: account.email,
      userId: account.user.identity_document,
      roles: account.roles.map((r) => r.name),
      name: `${account.user.first_name} ${account.user.last_name}`,
    };
    const token = this.jwtService.sign(payload);

    // Retorna datos útiles, incluyendo el nuevo token
    return {
      accountId: account.id,
      userId: account.user.identity_document,
      firstName: account.user.first_name,
      lastName: account.user.last_name,
      email: account.email,
      roles: account.roles.map((r) => r.name),
      token: token,
    };
  }
}
