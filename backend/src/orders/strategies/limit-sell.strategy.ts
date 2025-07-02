import { BadRequestException } from "@nestjs/common";
import { OrderDto } from "../dto/order.dto";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";

export class LimitSell implements IOrderTypeStrategy{
    constructor(
        private readonly orderDto: OrderDto,
        private readonly alpacaMarketService: AlpacaMarketService
    ){}
    async valid(): Promise<void> {
        const {limit_price, stop_price, side, type, symbol} = this.orderDto
        if (!limit_price || stop_price){
            throw new BadRequestException(`Datos de orden invalidos para orden de tipo ${side} - ${type}`)
        }
        const quoteAmmount = await this.alpacaMarketService.getTradesLatest(symbol)
        if ( limit_price <= quoteAmmount.trade.p){
            throw new BadRequestException('El valor limit_price no puede ser menor al precio de mercado de la accion, o se ejecutara como market')
        }
    }
    calculateAmountOrder(): number {
        const {qty, limit_price} = this.orderDto
        return qty * limit_price
    }
   
    
 
}