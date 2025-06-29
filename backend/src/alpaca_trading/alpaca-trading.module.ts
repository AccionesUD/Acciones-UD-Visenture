import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlpacaTradingService } from './alpaca-trading.service';
import { AlpacaTradingController } from './alpaca-trading.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { StocksModule } from 'src/stocks/stocks.module';
import { SharesModule } from 'src/shares/shares.module';

@Module({
  imports: [
    HttpModule, 
    CacheModule.register(),
    ScheduleModule.forRoot(),
    StocksModule,
    SharesModule,
  ],
  providers: [AlpacaTradingService],
  controllers: [AlpacaTradingController],
  exports: [AlpacaTradingService],
})
export class MarketsModule {}
