import { Repository } from "typeorm";
import { OrderDto } from "../dto/order.dto";
import { Order } from "../entities/orders.entity";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { Commission } from "../entities/comissions.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { listCommission } from "../enums/list-commissions.enum";
import { OrderCommissions } from "../entities/orders_commission.entity";
import { BadRequestException, RequestTimeoutException } from "@nestjs/common";
import { Comissions } from "../consts/commisions-percents.consts";
import { OrderUpdateDto } from "../dto/order-update.dto";
import { AlpacaBrokerService } from "src/alpaca_broker/services/alpaca_broker.service";
import { CreateTransactionDto } from "src/transactions/dtos/create-transaction.dto";
import { typeTransaction } from "src/transactions/enums/type-transaction.enum";
import { statusTransaction } from "src/transactions/enums/status-transaction.enum";
import { TransactionsService } from "src/transactions/services/transaction.service";
import { sideOrder } from "../enums/side-order.enum";
import { StatusEventsOrder } from "../enums/status-order.enum";
import { UpdateTransactionDto } from "src/transactions/dtos/update-transaction.dto";
import { BriefcaseService } from "src/briefcases/services/briefcases.service";


export abstract class AbstractOrder {
    constructor(
        protected readonly comissionRepository: Repository<Commission>,
        protected readonly orderCommissionRepository: Repository<OrderCommissions>,
        protected readonly alpacaBrokerService: AlpacaBrokerService,
        protected readonly orderRepository: Repository<Order>,
        protected readonly transactionsService: TransactionsService,
        protected readonly briefcasesService: BriefcaseService
    ) { }

    abstract createOrder(orderDto: OrderDto, strategy: IOrderTypeStrategy): void
    abstract updateOrder(orderUpdateDto: OrderUpdateDto, order: Order): void
    abstract calculateAmountOrder(strategy: IOrderTypeStrategy): Promise<{quoteAmmount: number, comissionAmount: number}> 

    async listCommissions(name: listCommission) {
        const commissions = await this.comissionRepository.findOneBy({ name })
        return commissions
    }

    async generatedCommissions(order: Order) {
        const commissionApp = await this.listCommissions(listCommission.APPCOMMISSION)
        const commissionCommissioner = await this.listCommissions(listCommission.COMISIONERCOMISSION)
        if (!commissionApp || !commissionCommissioner) {
            throw new BadRequestException('Falta informacion para calcular comisiones')
        }
        const createCommissionApp = this.orderCommissionRepository.create({
            order: { id: order.id },
            commission: { id: commissionApp.id },
            ammount_commission: ((order.approximate_total * parseFloat(commissionApp.percent_value.toFixed(4))) /
                (1 + parseFloat(commissionApp.percent_value.toFixed(4))))
        })
        try {
            await this.orderCommissionRepository.save(createCommissionApp)
            if (order.account_commissioner) {
                const createcommissionCommissioner = this.orderCommissionRepository.create({
                    order: { id: order.id },
                    commission: { id: commissionCommissioner.id },
                    ammount_commission: createCommissionApp.ammount_commission * commissionCommissioner.percent_value
                })
                await this.orderCommissionRepository.save(createcommissionCommissioner)
            }
        } catch (error) {
            throw new RequestTimeoutException('error en la bd')
        }
    }

    async updateCommissions(order: Order) {
        const order_commissions = await this.orderCommissionRepository.find({ where: { order: { id: order.id } } })
        order_commissions.forEach((value) => {
            value.ammount_commission = (order.approximate_total * value.commission.percent_value) / (1 + value.commission.percent_value)
        })
        try {
            await this.orderCommissionRepository.save(order_commissions)
        } catch (error) {
            throw new RequestTimeoutException('error en la bd')
        }
    }


    async generateOrder(orderDto: OrderDto, quoteAmmount: number, comissionAmount: number) {
        const orderAlpaca = await this.alpacaBrokerService.createOrder(orderDto)
        const orderAmount = quoteAmmount + comissionAmount
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
                value_transaction: orderDto.side == sideOrder.BUY ? -order.approximate_total : quoteAmmount,
                type_transaction: orderDto.side == sideOrder.BUY ? typeTransaction.BUY: typeTransaction.SELL,
                status: orderDto.side == sideOrder.BUY ? statusTransaction.PROCESSING : statusTransaction.PENDING,
                operation_id: orderCreate.id
            })
            await this.transactionsService.createTransaction(transaccionOrder)
            await this.generatedCommissions(orderCreate)
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

    async generateUpdateOrder(orderUpdateDto: OrderUpdateDto, order: Order) {
        if (orderUpdateDto.status == StatusEventsOrder.FILLED) {
            order.fill_qyt = orderUpdateDto.fill_qyt
            order.filled_avg_price = orderUpdateDto.filled_avg_price

            const commisions = await this.listCommissions(listCommission.APPCOMMISSION)
            const ammountOrder = order.fill_qyt! * order.filled_avg_price!
            const commisionApply = ammountOrder * commisions?.percent_value!
            order.approximate_total = ammountOrder + commisionApply
            await this.transactionsService.updateTransaction(new UpdateTransactionDto({
                status: statusTransaction.COMPLETE,
                value_transaction: order.side == sideOrder.BUY ? -(ammountOrder + commisionApply): ammountOrder,
                operation_id: order.id
            }))
            await this.updateCommissions(order)
        }
        if ([StatusEventsOrder.REJECTED, StatusEventsOrder.EXPIRED, StatusEventsOrder.CANCELED].includes(orderUpdateDto.status)) {
            const updateTransactionDto = new UpdateTransactionDto({
                status: statusTransaction.CANCELED,
                operation_id: order.id
            })
            await this.transactionsService.updateTransaction(updateTransactionDto)
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
