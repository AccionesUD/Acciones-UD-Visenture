import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlpacaTradingService } from './alpaca-trading.service';
import { AlpacaTradingController } from './alpaca-trading.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [HttpModule, CacheModule.register(),
    ScheduleModule.forRoot(),
  ],
  providers: [AlpacaTradingService],
  controllers: [AlpacaTradingController],
  exports: [AlpacaTradingService],
})
export class MarketsModule {}
