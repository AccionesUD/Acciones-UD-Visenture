import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharesController } from './shares.controller';
import { Stock } from '../stocks/entities/stocks.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Share } from './entities/shares.entity';
import { SharesService } from './services/shares.service';
import { StocksModule } from 'src/stocks/stocks.module';
import { MarketsModule } from 'src/alpaca_trading/alpaca-trading.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Share, Stock]),
    forwardRef(() => StocksModule), // Importamos StocksModule de forma diferida
    forwardRef(() => MarketsModule), 
    ScheduleModule.forRoot(),
  ],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService, TypeOrmModule.forFeature([Share])],
})
export class SharesModule {}