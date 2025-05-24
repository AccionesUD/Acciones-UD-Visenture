import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entitiy';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  imports: [AuthModule, TypeOrmModule.forFeature([User, Account])],
  exports: [AccountsService],
})
export class AccountsModule {}
