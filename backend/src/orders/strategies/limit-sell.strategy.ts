import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";

export class LimitSell implements IOrderTypeStrategy{
    constructor(
        private readonly orderDto: OrderDto
    ){}
    valid(): Promise<void> {
        return Promise.reject(new Error("Method not implemented."));
    }
    calculateAmountOrder(): Promise<number> {
        throw new Error("Method not implemented.");
    }
   
    
 
}