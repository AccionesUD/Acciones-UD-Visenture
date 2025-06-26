import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoutesEndpointsEvents } from '../consts/routes-endpoints-events.const';
import { ConnectSSEProvider } from './connectSSE.provider';
import { error } from 'console';
import { HandlerStatusEventsOrder, HandlerStatusEventsTransfer, StatusEventsTransfer } from '../consts/handler-status-events.const';
import { OrdersService } from 'src/orders/providers/orders.service';
import { statusTransaction } from 'src/transactions/enums/status-transaction.enum';
import { TransactionsService } from 'src/transactions/services/transaction.service';
import { UpdateTransactionDto } from 'src/transactions/dtos/update-transaction.dto';
import { IsLowercase } from 'class-validator';

@Injectable()
export class EventsAlpacaService implements OnModuleInit {
    constructor(
        private readonly configService: ConfigService,
        private readonly connecSSEProvider: ConnectSSEProvider,
        private readonly orderService: OrdersService,
        private readonly transactionService: TransactionsService
    ) { }

    onModuleInit() {
        this.ordersEvents()
        this.transactionEvents()
    }

    authorization() {
        const headers = {
            accept: 'text/event-stream',
            authorization:
                'Basic Q0tTTEFYQ1cwNU83Q0pZR0FFNUs6MWx6NWVJWTlwWm5zemdtS1Z3THJhaFlGdUtCTWZMV0Jwb3JFZjNXTA==',
        };
        return headers
    }


    async ordersEvents() {
        const url = `${this.configService.get('ALPACA_BROKER_BASE_URL')}${RoutesEndpointsEvents.tradeEvents}`
        const response = this.connecSSEProvider.EventsBroker(url, this.authorization())

        const observer = {
            next: x => {
                if (x.event in HandlerStatusEventsOrder){
                    
                }
            },
            error: err => (console.log(err))
        }
        response.subscribe(observer)

    }

    async transactionEvents(){
        const url = `${this.configService.get('ALPACA_BROKER_BASE_URL')}${RoutesEndpointsEvents.transferEvents}`
        const response = this.connecSSEProvider.EventsBroker(url, this.authorization())

        const observer = {
            next: x => {
                if (HandlerStatusEventsTransfer.includes(x.status_to)){
                    const UpdateDto = new UpdateTransactionDto({
                        status: x.status_to.toLowerCase(),
                        operation_id: x.transfer_id
                    })
                    this.transactionService.updateTransaction(UpdateDto)
                }
            }
        }
        response.subscribe(observer)
    }
}
