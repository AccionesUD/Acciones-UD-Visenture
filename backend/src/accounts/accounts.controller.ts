import { Body, Controller, Post } from '@nestjs/common';
import { MakeFundignAccountDto } from './dtos/make-funding-account.dto';
import { AccountsService } from './services/accounts.service';

@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ) { }

    @Post('funding')
    async createTransaction(@Body() makeFundignAccountDto: MakeFundignAccountDto) {
        return this.accountsService.fundingAccount(makeFundignAccountDto)
    }
}
