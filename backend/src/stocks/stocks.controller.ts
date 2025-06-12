import { Controller, Post, Get } from '@nestjs/common';
import { ServicesService } from './services/services.service';
import { Stock } from './entities/stocks.entity';

@Controller('stocks')
export class StocksController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('inicializacion')
  async inicializarMercados() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.servicesService.inicializarMercados();
  }

  @Get()
  async getAllStocks(): Promise<Stock[]> {
    return this.servicesService.findAll();
  }
}
