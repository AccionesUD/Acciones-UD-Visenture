import { Module } from '@nestjs/common';
import { BriefcaseService } from './services/briefcases.service';
import { BriefcaseController } from './briefcases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Briefcase } from './entities/briefcases.entity';
import { Asset } from './entities/assets.entity';
import { AlpacaMarketModule } from 'src/alpaca_market/alpaca_market.module';

@Module({
  providers: [BriefcaseService],
  exports: [BriefcaseService],
  controllers: [BriefcaseController],
  imports: [AlpacaMarketModule, TypeOrmModule.forFeature([Asset, Briefcase])]
})
export class BriefcaseModule {}
