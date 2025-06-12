import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharesController } from './shares.controller';
import { Stock } from '../stocks/entities/stocks.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Share } from './entities/shares.entity';
import { SharesService } from './services/shares.service';
import { MarketsModule } from 'src/alpaca_trading/alpaca-trading.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Share, Stock]),
    MarketsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}