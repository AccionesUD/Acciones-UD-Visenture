import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { HttpModule } from '@nestjs/axios';
import { OrdersService } from './providers/orders.service';
import { FactoryOrder } from './providers/factory-order.provider';
import { PurchaseOrder } from './providers/purchase-order.provider';
import { SalesOrder } from './providers/sales-order.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from 'src/shares/entities/shares.entity';

@Module({
  imports: [HttpModule, AccountsModule],
  controllers: [OrdersController],
  providers: [OrdersService, FactoryOrder, PurchaseOrder, SalesOrder],
})
export class OrdersModule {}
