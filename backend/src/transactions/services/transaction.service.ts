import { BadRequestException, forwardRef, Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../entities/transactions.entity';
import { statusTransaction } from '../enums/status-transaction.enum';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';

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
            where: {account: {id: accountId}, status: In([statusTransaction.COMPLETE, statusTransaction.PROCESSING])}
        })
        const balance = transactions.reduce((sum, t) => sum + t.value_transaction, 0)
        return {balance: balance}
    }

    async getTransaction(operation_id: string){
        try {
            const transaction = await this.transactionRepository.findOneBy({operation_id})
            return transaction
        } catch (error) {
            throw new RequestTimeoutException('error en la bd')
        }
    
    }

    async getAllTransactions(accountId: number){
        const transactions = this.transactionRepository.find({
            where: {account: {id: accountId}}
        })
        return transactions
    }

    async updateTransaction(updateTransactionDto: UpdateTransactionDto){
        const transaction = await this.getTransaction(updateTransactionDto.operation_id!)
        if (transaction){
            transaction.status = updateTransactionDto.status
            transaction.value_transaction = updateTransactionDto.value_transaction ?? transaction.value_transaction
            if (updateTransactionDto){}
            try {
                await this.transactionRepository.save(transaction)
            } catch (error) {
                throw new RequestTimeoutException('error en la bd')
            }
        }
    }
}
