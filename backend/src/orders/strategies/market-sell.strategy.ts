import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { BadRequestException } from "@nestjs/common";

export class MarketSell implements IOrderTypeStrategy {
    constructor(
        private readonly orderDto: OrderDto,
    ) {

    }
    valid(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    calculateAmountOrder(): Promise<number> {
        throw new Error("Method not implemented.");
    }

  
}