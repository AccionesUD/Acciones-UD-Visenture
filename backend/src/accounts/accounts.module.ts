import { forwardRef, Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';
import { AuthModule } from 'src/auth/auth.module';
import { Role } from 'src/roles-permission/entities/role.entity';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Account, Role]),
    forwardRef(() => AlpacaBrokerModule),
    NotificationsModule, 
  ],
  exports: [AccountsService],
})
export class AccountsModule {}
