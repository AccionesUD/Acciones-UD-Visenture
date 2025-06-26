import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { MakeFundignAccountDto } from './dtos/make-funding-account.dto';
import { AccountsService } from './services/accounts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ) { }

    @Post('/funding')
    async createTransaction(@Body() makeFundignAccountDto: MakeFundignAccountDto, @Req() req) {
        return this.accountsService.fundingAccount(makeFundignAccountDto, req.user.userId)
    }

    @Get('/balance')
    async getBalanceAccount(@Req() req){
        return this.accountsService.getBalanceAccount(req.user.userId)
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @Get('/orders')
    async getOrdersAccount(@Req() req){
        return this.accountsService.getOrdersAccount(req.user.userId)
    }
}
