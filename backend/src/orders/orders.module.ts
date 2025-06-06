import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AccountsModule } from 'src/accounts/accounts.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, AccountsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
