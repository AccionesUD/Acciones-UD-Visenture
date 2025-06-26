import { HttpService } from "@nestjs/axios";
import { BadRequestException, forwardRef, HttpException, HttpStatus, Inject, Injectable, RequestTimeoutException } from "@nestjs/common";
import { CreateUserDto } from "src/users/dtos/create-user.dto";
import { ValidateDataAccountProvider } from "./validate_data_account.provider";
import { Axios, AxiosResponse } from "axios";
import { firstValueFrom, identity } from "rxjs";
import { FundCapitalAccount } from "./fund_capital_account.provide";
import { TransactionsService } from "src/transactions/services/transaction.service";
import { CreateTransactionDto } from "src/transactions/dtos/create-transaction.dto";
import { typeTransaction } from "src/transactions/enums/type-transaction.enum";
import { MakeFundignAccountDto } from "src/accounts/dtos/make-funding-account.dto";
import { AccountsService } from "src/accounts/services/accounts.service";
import { AccountsModule } from "src/accounts/accounts.module";
import { valueDefaultFunding } from "../consts/value_default_funding.conts";
import { OrderDto } from "src/orders/dto/order.dto";
import { RoutesEndpointsBroker } from "../consts/routes-endpoint-broker.const";
import { response } from "express";
import { RoutesEndpointsMarket } from "src/alpaca_market/consts/routes-endpoints-market.const";

@Injectable()
export class AlpacaBrokerService {

    constructor(
        private readonly httpService: HttpService,
        private readonly validateDataAccount: ValidateDataAccountProvider,
        private readonly fundCapitalAccount: FundCapitalAccount,
        private readonly transactionService: TransactionsService,
        @Inject(forwardRef(() => AccountsService))
        private readonly accountService: AccountsService
    ) { }

    public async createAccountAlpaca(createUserDto: CreateUserDto) {
        const data = await this.validateDataAccount.validate(createUserDto)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(RoutesEndpointsBroker.createAccount, data))
            const accountIdAlpaca = response.data.id
            return accountIdAlpaca
        } catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }
    }


    async makeFundignAccount(makeFundignAccountDto: MakeFundignAccountDto) {
        const account = await this.accountService.checkExistenceAccount(undefined, makeFundignAccountDto.idAccount)
        if (!account) {
            throw new BadRequestException('La cuenta proporcionada no existe')
        }
        const response = await this.fundCapitalAccount.fundCapital({
            ...makeFundignAccountDto,
            idAccountAlpaca: account.alpaca_account_id,
            amountTranfer: makeFundignAccountDto.amountTranfer ?? valueDefaultFunding
        })
        if (!response) {
            throw new BadRequestException('No se pudo realizar las tranferencia')
        }
        await this.transactionService.createTransaction(new CreateTransactionDto({
            type_transaction: typeTransaction.RECHARGE,
            value_transaction: makeFundignAccountDto.amountTranfer,
            operation_id: response,
            account: account
        }))
        return ({
            succes: true,
            message: 'Operacion de fondeo creada y en proceso'
        })
    }

    async createOrder(orderDto: OrderDto){
        const account = await this.accountService.checkExistenceAccount(undefined , orderDto.account!.id)
        if (!account?.alpaca_account_id){
            throw new BadRequestException('La cuenta no existe en Alpaca Broker')
        }
        const url = RoutesEndpointsBroker.createOrder(account.alpaca_account_id)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
            this.httpService.post(url, orderDto))
            return response.data.id
        } catch (error) {
            throw new BadRequestException(error.data)
        }
    }

}

