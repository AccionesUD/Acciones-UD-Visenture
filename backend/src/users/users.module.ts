import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { UsersController } from './users.controller';
import { Account } from 'src/accounts/entities/account.entity';
import { AccountsModule } from 'src/accounts/accounts.module';
import { UserPasswordReset } from 'src/password-reset/entities/users-passwordReset.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ],
  exports: [UsersService],
  imports: [AccountsModule,
    forwardRef(() => AccountsModule), 
    TypeOrmModule.forFeature([User, Account, UserPasswordReset])],
})
export class UsersModule {}
