import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { ServiceService } from './services/service.service';

@Module({
  controllers: [SharesController],
  providers: [ServiceService]
})
export class SharesModule {}
