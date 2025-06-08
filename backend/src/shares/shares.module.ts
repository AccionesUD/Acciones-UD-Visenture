import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from './entities/shares.entity';
import { Stock } from '../stocks/entities/stocks.entity';
import { SharesController } from './shares.controller';
import { SharesService } from './services/service.service';

@Module({
  imports: [TypeOrmModule.forFeature([Share, Stock])],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}
