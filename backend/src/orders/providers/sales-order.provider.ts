import { Injectable } from "@nestjs/common";
import { AbstractOrder } from "./abstract-order.provider";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";

@Injectable()
export class SalesOrder extends AbstractOrder{
    createOrder(orderDto: OrderDto, strategy: IOrderTypeStrategy): void {
        throw new Error("Method not implemented.");
    }
   
}