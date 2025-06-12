import { Console } from "console";
import { OrderDto } from "../dto/order.dto";
import { typeOrder } from "../enums/type-order.enum";
import { validate } from "class-validator";
import { sideOrder } from "../enums/side-order.enum";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PurchaseOrder } from "./purchase-order.provider";
import { plainToInstance } from "class-transformer";
import { SalesOrder } from "./sales-order.provider";

@Injectable()
export class FactoryOrder{

    constructor(
        private readonly purchaseOrder: PurchaseOrder,
        private readonly salesOrder: SalesOrder
    ){}
    
    async create(orderDto: OrderDto){
        const {side} = orderDto
        if (side == sideOrder.BUY){
            return this.purchaseOrder.createOrder(orderDto)
        }
        else if(side == sideOrder.SELL){
            return this.salesOrder.createOrder(orderDto)
        }
        else {
            throw new HttpException('Transaccion de orden invalida (buy/sell) unicamente ', HttpStatus.BAD_REQUEST)
        }
    } 
}