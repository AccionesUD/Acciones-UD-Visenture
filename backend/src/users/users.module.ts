import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Role } from '../roles-permission/entities/role.entity';
import { UsersController } from './users.controller';
import { Account } from 'src/accounts/entities/account.entity';
import { AccountsModule } from 'src/accounts/accounts.module';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';
import { RolesPermissionModule } from 'src/roles-permission/roles-permission.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    AlpacaBrokerModule,
    AccountsModule,
    RolesPermissionModule,
    forwardRef(() => AccountsModule),
    TypeOrmModule.forFeature([User, Account, Role]),
  ],
})
export class UsersModule {}
