import { Controller, Get } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { MarketData } from './dtos/market-data.interface';

@Controller('market')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  //endPointObtenerListaDeMercados
  @Get()
  async list() {
    return await this.marketsService.getMarkets();
  }

  /* @Get('all')
  getMarketData(): MarketData [] {
    return this.marketsService.getParsedData();
  }*/
}

