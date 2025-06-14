import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { UsersController } from './users.controller';
import { Account } from 'src/accounts/entities/account.entity';
import { AccountsModule } from 'src/accounts/accounts.module';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';


@Module({
  controllers: [UsersController],
  providers: [UsersService, ],
  exports: [UsersService],
  imports: [AlpacaBrokerModule, 
    forwardRef(() => AccountsModule), 
    TypeOrmModule.forFeature([User, Account])],
})
export class UsersModule {}
