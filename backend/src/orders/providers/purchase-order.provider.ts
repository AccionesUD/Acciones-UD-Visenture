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
      readonly briefcasesService: BriefcaseService,
      @InjectRepository(Order)
      readonly orderRepository: Repository<Order>,
      @InjectRepository(Commission)
      readonly commissionRepository: Repository<Commission>,
      @InjectRepository(OrderCommissions)
      readonly orderCommissionRepository: Repository<OrderCommissions>,
      readonly alpacaBrokerService: AlpacaBrokerService,
      readonly transactionService: TransactionsService

   ) { super(commissionRepository, orderCommissionRepository, alpacaBrokerService, orderRepository, transactionService, briefcasesService) }

   async createOrder(orderDto: OrderDto, strategy: IOrderTypeStrategy) {
      await strategy.valid()
      const { quoteAmmount, comissionAmount } = await this.calculateAmountOrder(strategy)
      const accountAmmount = await this.transactionService.calculateCurrentBalance(orderDto.account.id)
      if ((quoteAmmount + comissionAmount) > accountAmmount.balance) {

         throw new ConflictException('El usuario no cuenta con saldo suficiente para esta transaccion')
      }
      return super.generateOrder(orderDto, quoteAmmount, comissionAmount)
   }

   async calculateAmountOrder(strategy: IOrderTypeStrategy) {
      const comission = await super.listCommissions(listCommission.APPCOMMISSION)
      const quoteAmmount = await strategy.calculateAmountOrder()
      let commisionApply = comission?.percent_value
      if (!comission) {
         commisionApply = Comissions.AppCommission
      }
      let comissionAmount = (quoteAmmount * commisionApply!)
      return {quoteAmmount, comissionAmount}
   }

   async updateOrder(orderUpdateDto: OrderUpdateDto, order: Order) {
      await super.generateUpdateOrder(orderUpdateDto, order)
      if (orderUpdateDto.status == StatusEventsOrder.FILLED){
         const orderUpdate = await this.orderRepository.findOne({
                where: {id: order.id},
                relations: ['account', 'share']
             })
         await this.briefcasesService.addAssetsBriefcase(orderUpdate!)

      }
   }
}