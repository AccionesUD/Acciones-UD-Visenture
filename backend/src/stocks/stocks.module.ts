// stocks.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { ServicesService } from './services/services.service';
import { Stock } from './entities/stocks.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';


@Module({
  imports: [
    // Hacemos disponible el repositorio de Stock en este módulo
    TypeOrmModule.forFeature([Stock]),
    HttpModule,
    ConfigModule,
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 60,
    }),
  ],
  controllers: [StocksController],
  providers: [ServicesService],
  exports: [ServicesService, TypeOrmModule.forFeature([Stock])],
})
export class StocksModule {}
