import { Controller, Post } from '@nestjs/common';
import { ServicesService } from './services/services.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('inicializacion')
  async inicializarMercados() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.servicesService.inicializarMercados();
  }
}
