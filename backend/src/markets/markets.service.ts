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

    // Solo primeros 10 para ejemplo y evitar muchos requests
    const limitedAssets = data.slice(0, 10);

    const markets: MarketDto[] = [];
    for (const asset of limitedAssets) {
      let price: number | undefined = undefined;
      try {
        const priceUrl = `${process.env.ALPACA_BASE_URL}/v2/stocks/${asset.symbol}/quotes/latest`;
        const priceResp$ = this.httpService.get<{ askprice?: number }>(
          priceUrl,
          { headers },
        );
        const priceResp = await firstValueFrom(priceResp$);

        // Si no viene askprice, queda como undefined (no null)
        price =
          priceResp.data?.askprice !== undefined
            ? priceResp.data.askprice
            : undefined;
      } catch {
        price = undefined;
      }

      markets.push({
        symbol: asset.symbol,
        name: asset.name,
        isActive: asset.status === 'active',
        country: asset.country ?? '',
        currency: asset.currency ?? '',
        status: asset.status,
        price,
      });
    }

    await this.cacheManager.set(cacheKey, markets, 60);
    return markets;
  }
}
