import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { ServicesService } from './services/services.service';

@Module({
  controllers: [StocksController],
  providers: [ServicesService]
})
export class StocksModule {}
