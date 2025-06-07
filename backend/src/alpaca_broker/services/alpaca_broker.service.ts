import { HttpService } from "@nestjs/axios";
import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "src/users/dtos/create-user.dto";
import { defaultAccountAlpacaEnum } from "../enums/default-values-account-alpaca.enum";
import { ValidateDataAccountProvider } from "./validate_data_account.provider";
import { Axios, AxiosResponse } from "axios";
import { firstValueFrom, identity } from "rxjs";
import { response } from "express";
import { json } from "stream/consumers";
import { FundCapitalAccount } from "./fund_capital_account.provide";
import { Account } from "src/accounts/entities/account.entity";

@Injectable()
export class AlpacaBrokerService {

    constructor(
        private readonly httpService: HttpService,
        private readonly validateDataAccount: ValidateDataAccountProvider,
        private readonly fundCapitalAccount: FundCapitalAccount
    ) { }

    public async createAccountAlpaca(createUserDto: CreateUserDto, path: string = '/v1/accounts') {
        const data = await this.validateDataAccount.validate(createUserDto)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(path, data))
            const accountIdAlpaca = response.data.id
            this.fundCapitalAccount.fundCapital(accountIdAlpaca)
            return accountIdAlpaca
        } catch (error) {
            throw new HttpException(error.response.data, HttpStatus.BAD_REQUEST)
        }
    }

}

