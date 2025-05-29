import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MarketsService } from './markets.service';
import { MarketsController } from './markets.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [MarketsService],
  controllers: [MarketsController],
  exports: [MarketsService],
})
export class MarketsModule {}
