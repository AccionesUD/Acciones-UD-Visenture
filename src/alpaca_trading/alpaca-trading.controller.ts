import { Controller, Get } from '@nestjs/common';
import { AlpacaTradingService } from './alpaca-trading.service';
import { MarketData } from 'src/stocks/dtos/market-data.interface';

@Controller('market')
export class AlpacaTradingController {
  constructor(private readonly marketsService: AlpacaTradingService) {}

  //endPointObtenerListaDeMercados
  @Get()
  async list() {
    return await this.marketsService.getMarkets();
  }

 /*@Get('all')
  getMarketData(): MarketData [] {
    return this.marketsService.getParsedData();
  }*/
}

