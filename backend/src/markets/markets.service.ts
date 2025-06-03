import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MarketDto } from './dtos/market.dto';
import { AlpacaAsset } from './dtos/alpaca-asset.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MarketsService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getMarkets(): Promise<MarketDto[]> {
    const cacheKey = 'markets-list';
    const cached = await this.cacheManager.get<MarketDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Usa ConfigService en vez de process.env
    const baseUrl = this.configService.get<string>('ALPACA_BASE_URL');
    const apiKey = this.configService.get<string>('ALPACA_API_KEY');
    const secretKey = this.configService.get<string>('ALPACA_SECRET_KEY');

    const url = `${baseUrl}/assets`;
    const headers = {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': secretKey,
    };

    const response$ = this.httpService.get<AlpacaAsset[]>(url, { headers });
    const { data } = await firstValueFrom(response$);

    // Solo primeros 10 para ejemplo y evitar muchos requests
    const limitedAssets = data.slice(0, 10);

    const markets: MarketDto[] = [];
    for (const asset of limitedAssets) {
      let price: number | undefined = undefined;
      try {
        const priceUrl = `${baseUrl}/v2/stocks/${asset.symbol}/quotes/latest`;
        const priceResp$ = this.httpService.get<{ askprice?: number }>(
          priceUrl,
          { headers },
        );
        const priceResp = await firstValueFrom(priceResp$);

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
