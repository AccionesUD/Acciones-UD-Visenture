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
import { AlpacaAsset } from 'src/assets/dto/alpaca-asset.dto';


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

      // markets.push({
      //   symbol: asset.symbol,
      //   name: asset.name_share,
      //   isActive: asset.status === 'active',
      //   //country: asset.country ?? '',
      //   currency: asset.currency ?? '',
      //   status: asset.status,
      //   price,
      // });
    }

    await this.cacheManager.set(cacheKey, markets, 60);
    return markets;
  }

  // Consulta periódica cada 5 minutos (ajustable)
  // @Cron('*/1 * * * *')
  // async handleCron() {
  //   this.logger.debug('Fetching market data from Alpaca...');
  //  await this.getMarketData('AAPL,MSFT,GOOGL');
  //}
  /*
   async getMarketData(symbols: string): Promise<void> {
     const url = `${this.configService.get<string>('ALPACA_BASE_URL')}/stocks/bars?symbols=${symbols}&timeframe=1Day`;
     
     try {
       const response = await this.httpService.get(url, {
         headers: {
           'APCA-API-KEY-ID': this.configService.get<string>('ALPACA_API_KEY'),
           'APCA-API-SECRET-KEY': this.configService.get<string>('ALPACA_SECRET_KEY')
         }
       }).toPromise();
 
       if (response && response.data) {
         this.parseMarketData(response.data);
         this.logger.log('Market data updated successfully');
       } else {
         this.logger.warn('No response or response data received from market data API');
       }
     } catch (error) {
       this.logger.error('Error fetching market data', error.stack);
     }
   }
 
   private parseMarketData(data: any): void {
     this.marketData = [];
     const bars = data.bars;
 
     for (const symbol in bars) {
       if (bars[symbol] && bars[symbol].length > 0) {
         const bar = bars[symbol][0];
         this.marketData.push({
           symbol: symbol,
           openPrice: bar.o,
           highPrice: bar.h,
           lowPrice: bar.l,
           closePrice: bar.c,
           volume: bar.v,
           timestamp: bar.t
         });
       }
     }
   }
 
   getParsedData(): MarketData[] {
     return this.marketData;
   }*/

  public async getAssetFromAlpaca(symbol: string): Promise<any> {
    const url = `${this.alpacaTradingUrl}/v2/assets/${symbol}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getAuthHeaders(),
          timeout: 5000,
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching asset ${symbol} from Alpaca`, {
        status: error.response?.status,
        message: error.response?.data?.message,
      });
      throw new Error(`Asset ${symbol} not found in Alpaca`);
    }
  }
}
