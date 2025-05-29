import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MarketDto } from './dtos/market.dto';
import { AlpacaAsset } from './dtos/alpaca-asset.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MarketsService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getMarkets(): Promise<MarketDto[]> {
    const cacheKey = 'markets-list';
    // Intenta obtener los datos del cache primero
    const cached = await this.cacheManager.get<MarketDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${process.env.ALPACA_BASE_URL}/assets`;
    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
    };

    const response$ = this.httpService.get<AlpacaAsset[]>(url, { headers });
    const { data } = await firstValueFrom(response$);

    const markets = data.map(
      (asset): MarketDto => ({
        symbol: asset.symbol,
        name: asset.name,
        isActive: asset.status === 'active',
      }),
    );

    // Guarda en el cache por 60 segundos
    await this.cacheManager.set(cacheKey, markets, 60);

    return markets;
  }
}
