import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "src/users/dtos/create-user.dto";
import { defaultAccountAlpacaEnum } from "../enums/default-values-account-alpaca.enum";
import { ValidateDataAccountProvider } from "./validate_data_account.provider";
import { Axios, AxiosResponse } from "axios";
import { firstValueFrom, identity } from "rxjs";
import { response } from "express";
import { json } from "stream/consumers";

@Injectable()
export class AlpacaBrokerService {

    constructor(
        private readonly httpService: HttpService,
        private readonly validateDataAccount: ValidateDataAccountProvider
    ) { }

/*     public async createAccountAlpaca(createUserDto: CreateUserDto, path: string = '/v1/accounts') {
        const data = await this.validateDataAccount.validate(createUserDto)
        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.post(path, data))
            return response.data.id
        } catch (error) {
            throw new BadRequestException(error.response.data)
        }

    } */

}

