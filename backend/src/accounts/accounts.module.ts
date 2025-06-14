import { forwardRef, Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';
import { AuthModule } from 'src/auth/auth.module';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  imports: [AuthModule, forwardRef(() => AlpacaBrokerModule),  
    TypeOrmModule.forFeature([User, Account])],
  exports: [AccountsService],
})
export class AccountsModule { }
