import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { ServicesService } from './services/services.service';
import { Stock } from './stocks.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock]), // solo las entidades de este módulo
  ],
  controllers: [StocksController],
  providers: [ServicesService],
})
export class StocksModule {}
