import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { BadRequestException } from "@nestjs/common";

export class StopBuy implements IOrderTypeStrategy{
    constructor(
        private readonly orderDto: OrderDto,
        private readonly alpacaMarketService: AlpacaMarketService
    ){}

    async valid(): Promise<void> {
        const {limit_price, stop_price, type, side, symbol} = this.orderDto
        if (limit_price || !stop_price){
             throw new BadRequestException(`Datos de orden invalidos para orden de tipo ${side} - ${type}`)
        }
        const quoteAmmount = await this.alpacaMarketService.getQuotesLatest(symbol)
        console.log(quoteAmmount.quotes[symbol].ap)
        if (stop_price <= quoteAmmount.quotes[symbol].ap){
            throw new BadRequestException('El valor stop_price no puede ser menor al precio de mercado de la accion, o se ejecutara como market')
        }
        
    }
    calculateAmountOrder(): number {
        const {qty, stop_price} = this.orderDto
        return qty * stop_price
    }

}