import { Module } from '@nestjs/common';
import { ServicesService } from './services/briefcases.service';
import { BriefcaseController } from './briefcases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ServicesService],
  controllers: [BriefcaseController],
  imports: []
})
export class BriefcaseModule {}
