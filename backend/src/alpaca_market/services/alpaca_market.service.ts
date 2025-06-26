import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { RoutesEndpointsMarket } from '../consts/routes-endpoints-market.const';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { response } from 'express';
import { LoginDto } from 'src/auth/dto/login.dto';
import { plainToInstance } from 'class-transformer';
import { QuoteLatestDto } from '../dtos/quote-latest.dto';

@Injectable()
export class AlpacaMarketService {

    constructor(
        private readonly httpService: HttpService
    ) { }

    async getQuotesLatest(symbol: string) {
        const url = RoutesEndpointsMarket.quotesLatest(symbol)
        try {
            const response: AxiosResponse<LoginDto> = await firstValueFrom(
                this.httpService.get(url)
            )
            const infoQuote = plainToInstance(QuoteLatestDto, response.data)
            return infoQuote
        } catch (error) {
            throw new RequestTimeoutException(error.response.data, 'error en la peticion')
        }


    }


}
