import { Module } from '@nestjs/common';
import { EventsAlpacaController } from './events-alpaca.controller';
import { EventsAlpacaService } from './services/events-alpaca.service';
import { ConnectSSEProvider } from './services/connectSSE.provider';
import { OrdersModule } from 'src/orders/orders.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  controllers: [EventsAlpacaController],
  providers: [EventsAlpacaService, ConnectSSEProvider],
  imports: [OrdersModule, TransactionsModule]
})
export class EventsAlpacaModule {}
