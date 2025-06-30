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
import { OrderUpdateDto } from "../dto/order-update.dto";
import { StatusEventsOrder } from "../enums/status-order.enum";
import { UpdateTransactionDto } from "src/transactions/dtos/update-transaction.dto";
import { BriefcaseService } from "src/briefcases/services/briefcases.service";

@Injectable()
export class PurchaseOrder extends AbstractOrder {

   constructor(
      private readonly transactionService: TransactionsService,
      private readonly alpacaBrokerService: AlpacaBrokerService,
      private readonly briefcasesService: BriefcaseService,
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

   async updateOrder(orderUpdateDto: OrderUpdateDto, order: Order) {
      if (orderUpdateDto.status == StatusEventsOrder.FILLED) {
         order.fill_qyt = orderUpdateDto.fill_qyt
         order.filled_avg_price = orderUpdateDto.filled_avg_price
      
         const commisions = await super.listCommissions(listCommission.APPCOMMISSION)
         const ammountOrder = order.fill_qyt! * order.filled_avg_price!
         const commisionApply = ammountOrder * commisions?.percent_value!
         order.approximate_total = ammountOrder + commisionApply

         await this.transactionService.updateTransaction(new UpdateTransactionDto({
            status: statusTransaction.COMPLETE,
            value_transaction: ammountOrder + commisionApply,
            operation_id: order.id
         }))
         await super.updateCommissions(order)
         await this.briefcasesService.addAssetsBriefcase(order)         
      }
      if ([StatusEventsOrder.REJECTED, StatusEventsOrder.EXPIRED, StatusEventsOrder.CANCELED].includes(orderUpdateDto.status)) {
         const updateTransactionDto = new UpdateTransactionDto({
            status: statusTransaction.CANCELED,
            operation_id: order.id
         })
         await this.transactionService.updateTransaction(updateTransactionDto)
      }
      order = {
         ...order,
         filled_at: orderUpdateDto.filled_at!,
         canceled_at: orderUpdateDto.canceled_at!,
         expired_at: orderUpdateDto.expired_at!,
         status: orderUpdateDto.status
      }
      try {
         await this.orderRepository.save(order)
      } catch (error) {
         throw new RequestTimeoutException(error, 'error el la bd')
      }
   }
}