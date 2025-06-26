import { forwardRef, Module } from '@nestjs/common';
import { TransactionsService } from './services/transaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entity';


@Module({
  providers: [TransactionsService],
  exports: [TransactionsService],
  imports: [TypeOrmModule.forFeature([Transaction])]
})
export class TransactionsModule {}
