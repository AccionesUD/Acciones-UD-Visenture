import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { BadRequestException } from "@nestjs/common";

export class MarketBuy implements IOrderTypeStrategy {

    constructor(
        private readonly orderDto: OrderDto,
        private readonly alpacaMarketService: AlpacaMarketService
    ) {}

    async valid(): Promise<void> {
        const { limit_price, stop_price } = this.orderDto
        if (limit_price || stop_price) {
            throw new BadRequestException('Campos invalidos para el tipo de orden')
        }
    }
    async calculateAmountOrder(): Promise<number> {
        const { symbol, qty } = this.orderDto
        const quoteLatestSymbol = await this.alpacaMarketService.getTradesLatest(symbol)
        const askPrice = quoteLatestSymbol.trade.p
        return askPrice * qty
    }

}