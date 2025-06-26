import { Repository } from "typeorm";
import { OrderDto } from "../dto/order.dto";
import { Order } from "../entities/orders.entity";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { Commission } from "../entities/comissions.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { listCommission } from "../enums/list-commissions.enum";
import { OrderCommissions } from "../entities/orders_commission.entity";
import { BadRequestException, RequestTimeoutException } from "@nestjs/common";


export abstract class AbstractOrder {
    constructor(
        protected readonly comissionRepository: Repository<Commission>,
        protected readonly orderCommissionRepository: Repository<OrderCommissions>
    ) { }

    abstract createOrder(orderDto: OrderDto, strategy: IOrderTypeStrategy): void

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
}