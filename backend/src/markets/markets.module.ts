import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';

@Module({
  imports: [HttpModule],
  providers: [MarketsService],
  controllers: [MarketsController],
  exports: [MarketsService],
})
export class MarketsModule {}
