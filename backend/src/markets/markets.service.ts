import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MarketDto } from './dtos/market.dto';
import { AlpacaAsset } from './dtos/alpaca-asset.dto';

@Injectable()
export class MarketsService {
  constructor(private readonly httpService: HttpService) {}

  async getMarkets(): Promise<MarketDto[]> {
    const url = `${process.env.ALPACA_BASE_URL}/assets`;

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
    };

    const response$ = this.httpService.get<AlpacaAsset[]>(url, { headers });
    const { data } = await firstValueFrom(response$);

    return data.map(
      (asset): MarketDto => ({
        symbol: asset.symbol,
        name: asset.name,
        isActive: asset.status === 'active',
      }),
    );
  }
}
