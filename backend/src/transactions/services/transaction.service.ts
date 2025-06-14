import { BadRequestException, forwardRef, Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../entities/transactions.entity';
import { statusTransaction } from '../enums/status-transaction.enum';

@Injectable()
export class TransactionsService {

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,

    ) { }

    async createTransaction(createTransactionDto: CreateTransactionDto) {
        const transaction = this.transactionRepository.create(createTransactionDto)
        try {
            await this.transactionRepository.save(transaction)
        }
        catch (error) {
            throw new RequestTimeoutException(error, { description: 'Se presento un error en la operacion, intente luego' });
        }
    }
    
    async calculateCurrentBalance(accountId: number){
        const transactions = await this.transactionRepository.find({
            where: {account: {id: accountId}, status: statusTransaction.COMPLETED}
        })
        const balance = transactions.reduce((sum, t) => sum + t.value_transaction, 0)
        return {balance: balance}

    }
}
