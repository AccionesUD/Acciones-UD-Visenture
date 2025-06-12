import { Injectable } from "@nestjs/common";
import { AbstractOrder } from "./abstract-order.provider";
import { OrderDto } from "../dto/order.dto";

@Injectable()
export class SalesOrder extends AbstractOrder{
   createOrder(orderDto: OrderDto) {
       return orderDto
   }
}