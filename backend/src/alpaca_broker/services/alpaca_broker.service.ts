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

    public async createAccountAlpaca(createUserDto: CreateUserDto, path: string = '/v1/accounts') {
        const data = await this.validateDataAccount.validate(createUserDto)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(path, data))
            const accountIdAlpaca = response.data.id
            return accountIdAlpaca
        } catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }
    }


    async makeFundignAccount(makeFundignAccount: MakeFundignAccountDto) {
        const account = await this.accountService.checkExistenceAccount(undefined, undefined, makeFundignAccount.idAccountAlpaca)
        if (!account) {
            throw new BadRequestException('La cuenta proporcionada no existe')
        }
        makeFundignAccount.amountTranfer = valueDefaultFunding
        const response = await this.fundCapitalAccount.fundCapital(makeFundignAccount)
        if (!response) {
            throw new BadRequestException('No se pudo realizar las tranferencia')
        }
        await this.transactionService.createTransaction(new CreateTransactionDto({
            type_transaction: typeTransaction.RECHARGE,
            value_transaction: makeFundignAccount.amountTranfer,
            operation_id: response,
            account: account
        }))
        return ({
            succes: true,
            message: 'Operacion de fondeo creada y en proceso'
        })
    }

}

