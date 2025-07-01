import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { AbstractOrder } from "./abstract-order.provider";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { OrderUpdateDto } from "../dto/order-update.dto";
import { Order } from "../entities/orders.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Commission } from "../entities/comissions.entity";
import { Repository } from "typeorm";
import { AlpacaBrokerService } from "src/alpaca_broker/services/alpaca_broker.service";
import { OrderCommissions } from "../entities/orders_commission.entity";
import { TransactionsService } from "src/transactions/services/transaction.service";
import { BriefcaseService } from "src/briefcases/services/briefcases.service";
import { listCommission } from "../enums/list-commissions.enum";
import { Comissions } from "../consts/commisions-percents.consts";
import { StatusEventsOrder } from "../enums/status-order.enum";

@Injectable()
export class SalesOrder extends AbstractOrder {
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
        const assetsAccount = await this.briefcasesService.getBriefcaseAssets(orderDto.account.id)
        if (!assetsAccount && assetsAccount!.assets) {
            throw new ForbiddenException('empty briefcase')
        }
        const assetsSpecific = assetsAccount!.assets.filter((asset) => asset.ticket_share == orderDto.share.symbol)
        const assetsAvailable = assetsSpecific.reduce((sum, asset) => sum + asset.currentShareQuantity, 0)
        if (assetsAvailable < orderDto.qty) {
            throw new ConflictException('insufficient assets for the transaction')
        }
        const {quoteAmmount, comissionAmount} = await this.calculateAmountOrder(strategy)
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
             await this.briefcasesService.discountAssetsBriefcase(orderUpdate!)
          }
       }
}