import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { ServicesService } from './services/services.service';

@Module({
  controllers: [AssetsController],
  providers: [ServicesService]
})
export class AssetsModule {}
