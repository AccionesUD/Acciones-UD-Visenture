import { Console } from "console";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { OrderDto } from "../dto/order.dto";
import { BadRequestException } from "@nestjs/common";
import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";

export class LimitBuy implements IOrderTypeStrategy {
    constructor(
        private readonly orderDto: OrderDto,
        private readonly alpacaMarketService: AlpacaMarketService
    ){}
    async valid(): Promise<void> {
        const { limit_price, stop_price, type, side, symbol } = this.orderDto 
        if (!limit_price || stop_price){
            throw new BadRequestException(`Datos de orden invalidos para orden de tipo ${side} - ${type}`)
        }
        const quoteAmmount = await this.alpacaMarketService.getQuotesLatest(symbol)
        console.log(quoteAmmount.quotes[symbol].ap)
        if ( limit_price >= quoteAmmount.quotes[symbol].ap){
            throw new BadRequestException('El valor limit_price no puede ser mayor al precio de mercado de la accion, o se ejecutara como market')
        }
    }
    async calculateAmountOrder(): Promise<number> {
        const {qty, limit_price} = this.orderDto
        return qty * limit_price
    }
    
    

}