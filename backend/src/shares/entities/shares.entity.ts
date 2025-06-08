import { Stock } from "src/stocks/entities/stocks.entity"

export class Share{
    id: number
    class: string
    ticker: string
    name_share: string
    sector: string
    status: boolean
    tradable: boolean
    stock: Stock
}