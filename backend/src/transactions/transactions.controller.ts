import { Body, Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TransactionsService } from './services/transaction.service';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionService: TransactionsService
    ){}

    @Get('/balance/:accountId')
    async getBalanceAccount(@Param('accountId', ParseIntPipe) accountId){
        return this.transactionService.calculateCurrentBalance(accountId)
    }
}
