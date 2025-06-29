import { forwardRef, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { HttpModule } from '@nestjs/axios';
import { OrdersService } from './providers/orders.service';
import { FactoryOrder } from './providers/factory-order.provider';
import { PurchaseOrder } from './providers/purchase-order.provider';
import { SalesOrder } from './providers/sales-order.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Share } from 'src/shares/entities/shares.entity';
import { AlpacaMarketModule } from 'src/alpaca_market/alpaca_market.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { AlpacaBrokerModule } from 'src/alpaca_broker/alpaca_broker.module';
import { SharesModule } from 'src/shares/shares.module';
import { Order } from './entities/orders.entity';
import { Commission } from './entities/comissions.entity';
import { OrderCommissions } from './entities/orders_commission.entity';

@Module({
  imports: [
    forwardRef(() => AccountsModule),
    TypeOrmModule.forFeature([Order, Commission, OrderCommissions]), 
    HttpModule, forwardRef(() => AccountsModule), 
    forwardRef(() => SharesModule), 
    AlpacaMarketModule, 
    AlpacaBrokerModule, 
    TransactionsModule],
  controllers: [OrdersController],
  providers: [OrdersService, FactoryOrder, PurchaseOrder, SalesOrder],
  exports: [OrdersService]
})
export class OrdersModule { }
