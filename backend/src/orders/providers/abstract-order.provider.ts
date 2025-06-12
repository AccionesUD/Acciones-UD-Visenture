import { OrderDto } from "../dto/order.dto";


export abstract class AbstractOrder {
    abstract createOrder(orderDto: OrderDto): void
}