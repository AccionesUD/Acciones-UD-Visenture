import { Console } from "console";
import { OrderDto } from "../dto/order.dto";
import { typeOrder } from "../enums/type-order.enum";
import { validate } from "class-validator";
import { sideOrder } from "../enums/side-order.enum";
import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PurchaseOrder } from "./purchase-order.provider";
import { plainToInstance } from "class-transformer";
import { SalesOrder } from "./sales-order.provider";
import { IOrderTypeStrategy } from "../interfaces/order-type.interface";
import { MarketBuy } from "../strategies/market-buy.strategy";
import { LimitBuy } from "../strategies/limit-buy.strategy";
import { MarketSell } from "../strategies/market-sell.strategy";
import { AlpacaMarketService } from "src/alpaca_market/services/alpaca_market.service";
import { StopBuy } from "../strategies/stop-buy.strategy";

@Injectable()
export class FactoryOrder {

    constructor(
        private readonly purchaseOrder: PurchaseOrder,
        private readonly salesOrder: SalesOrder,
        private readonly alpacaMarketService: AlpacaMarketService
    ) { }

    async create(orderDto: OrderDto) {
        const { side, type } = orderDto
        let strategy: IOrderTypeStrategy
        switch (side) {
            case (sideOrder.BUY):
                console.log(type)
                switch (type) {
                    case typeOrder.MARKET:
                        strategy = new MarketBuy(orderDto, this.alpacaMarketService)
                        break
                    case typeOrder.LIMIT:
                        strategy = new LimitBuy(orderDto, this.alpacaMarketService)
                        break
                    case typeOrder.STOP:
                        strategy = new StopBuy(orderDto, this.alpacaMarketService)
                        break
                    default:
                        throw new BadRequestException(`Tipo de orden ${type} no soportado para orden ${side}`)
                }
                return this.purchaseOrder.createOrder(orderDto, strategy)
            case (sideOrder.SELL):
                switch (type){
                    case typeOrder.MARKET:
                        strategy = new MarketSell(orderDto)
                        break
                    case typeOrder.LIMIT:
                        strategy = new LimitBuy(orderDto, this.alpacaMarketService)
                        break
                    default:
                        throw new BadRequestException(`Tipo de orden ${type} no soportado para orden ${side}`)
                }
                return this.salesOrder.createOrder(orderDto, strategy)
            default:
                throw new BadRequestException('Tipo de side no es valido')
        }



        
    }
}