import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Cron, Interval } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { Observable, map } from 'rxjs';
import { MarketData } from 'src/stocks/dtos/market-data.interface';
import { MarketDto } from 'src/stocks/dtos/market.dto';
import { AlpacaAsset } from 'src/assets/dtos/alpaca-asset.dto';


@Injectable()
export class AlpacaTradingService {
  private readonly alpacaTradingUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly logger = new Logger(AlpacaTradingService.name);

  private marketData: MarketData[] = [];

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.alpacaTradingUrl = this.configService.get<string>('ALPACA_BASE_URL') || 'https://paper-api.alpaca.markets';
    this.apiKey = this.configService.get<string>('ALPACA_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('ALPACA_SECRET_KEY') || '';
  }

  private getAuthHeaders() {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
    };
  }

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

  async getAssetFromAlpaca(symbol: string): Promise<any> {
    const url = `${this.alpacaTradingUrl}/assets/${symbol}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getAuthHeaders(),
          timeout: 5000,
        })
      );

      if (!response.data) {
        throw new Error(`No data received for symbol ${symbol}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching asset ${symbol} from Alpaca`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: url
      });

      // Manejo específico para diferentes códigos de estado
      if (error.response?.status === 404) {
        throw new Error(`Asset ${symbol} not found in Alpaca. Verify the symbol is correct and supported.`);
      } else if (error.response?.status === 403) {
        throw new Error(`API credentials invalid or insufficient permissions for symbol ${symbol}`);
      } else {
        throw new Error(`Failed to fetch asset ${symbol}: ${error.message}`);
      }
    }
  }

  async getAllStocks(): Promise<{ symbol: string, name: string }[]> {
    const url = `${this.alpacaTradingUrl}/assets`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getAuthHeaders(),
          params: {
            status: 'active', // Solo activas
            asset_class: 'us_equity', // Solo acciones estadounidenses
            exchange: 'NYSE, NASDAQ', // Filtrar por NYSE y NASDAQ
          },
          timeout: 10000,
        })
      );

      if (!response.data) {
        throw new Error('No data received from Alpaca');
      }

      // Mapear a solo símbolo y nombre
      return response.data.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        market: asset.exchange, // Agregar mercado si es necesario
      }));
    } catch (error) {
      this.logger.error('Error fetching assets from Alpaca',{
        url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }); 
      throw new Error('Failed to fetch assets from Alpaca');
    }
  }
}
  