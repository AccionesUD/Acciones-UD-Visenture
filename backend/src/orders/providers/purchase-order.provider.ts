import { ConflictException, Injectable, RequestTimeoutException } from "@nestjs/common";
import { AbstractOrder } from "./abstract-order.provider";
import { OrderDto } from "../dto/order.dto";
import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";
import { typeOrder } from "../enums/type-order.enum";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { Comissions, Slippage } from "../consts/commisions-percents.consts";
import { TransactionsService } from "src/transactions/services/transaction.service";
import { AlpacaBrokerService } from "src/alpaca_broker/services/alpaca_broker.service";
import { Repository } from "typeorm";
import { Order } from "../entities/orders.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTransactionDto } from "src/transactions/dtos/create-transaction.dto";
import { typeTransaction } from "src/transactions/enums/type-transaction.enum";
import { statusTransaction } from "src/transactions/enums/status-transaction.enum";
import { share } from "rxjs";
import { Commission } from "../entities/comissions.entity";
import { listCommission } from "../enums/list-commissions.enum";
import { OrderCommissions } from "../entities/orders_commission.entity";

@Injectable()
export class PurchaseOrder extends AbstractOrder {

   constructor(
      private readonly transactionService: TransactionsService,
      private readonly alpacaBrokerService: AlpacaBrokerService,
      @InjectRepository(Order)
      private readonly orderRepository: Repository<Order>,
      @InjectRepository(Commission)
      readonly commissionRepository: Repository<Commission>,
      @InjectRepository(OrderCommissions)
      readonly orderCommissionRepository: Repository<OrderCommissions>

   ) { super(commissionRepository, orderCommissionRepository) }

   async createOrder(orderDto: OrderDto, strategy: IOrderTypeStrategy) {
      await strategy.valid()
      const orderAmount = await this.calculateAmountOrder(strategy)
      const accountAmmount = await this.transactionService.calculateCurrentBalance(orderDto.account.id)
      console.log(accountAmmount, orderAmount)
      if (orderAmount > accountAmmount.balance) {
         throw new ConflictException('El usuario no cuenta con saldo suficiente para esta transaccion')
      }
      const orderAlpaca = await this.alpacaBrokerService.createOrder(orderDto)
      const order = this.orderRepository.create({
         ...orderDto,
         share: orderDto.share,
         account: orderDto.account,
         account_commissioner: orderDto.account_commissioner
            ? { id: orderDto.account_commissioner }
            : null,
         order_id_alpaca: orderAlpaca,
         approximate_total: parseFloat(orderAmount.toFixed(4))
      })
      try {
         const orderCreate = await this.orderRepository.save(order)
         const transaccionOrder = new CreateTransactionDto({
            account: orderDto.account!,
            value_transaction: -order.approximate_total,
            type_transaction: typeTransaction.BUY,
            status: statusTransaction.PROCESSING,
            operation_id: orderCreate.id
         })
         await this.transactionService.createTransaction(transaccionOrder)
         await super.generatedCommissions(orderCreate)
         return {
            status: true,
            message: 'Orden creada con exito'
         }
      } catch (error) {
         throw new RequestTimeoutException(error, {
            description: 'Se presento un error en la operacion, intente luego',
         });
      }
   }

   async calculateAmountOrder(strategy: IOrderTypeStrategy) {
      const comission = await super.listCommissions(listCommission.APPCOMMISSION)
      const quoteAmmount = await strategy.calculateAmountOrder()
      let commisionApply = comission?.percent_value
      if (!comission) {
         commisionApply = Comissions.AppCommission
      }
      let comissionAmount = (quoteAmmount * commisionApply!)
      return quoteAmmount + comissionAmount
   }


}