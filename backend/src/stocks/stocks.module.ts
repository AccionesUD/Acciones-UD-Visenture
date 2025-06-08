// stocks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StocksController } from './stocks.controller';
import { ServicesService } from './services/services.service';
import { Stock } from './entities/stocks.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Hacemos disponible el repositorio de Stock en este módulo
    TypeOrmModule.forFeature([Stock]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [StocksController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class StocksModule {}
