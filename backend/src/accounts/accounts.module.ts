import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entitiy';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  imports: [TypeOrmModule.forFeature([User, Account])],
  exports: [AccountsService],
})
export class AccountsModule {}
