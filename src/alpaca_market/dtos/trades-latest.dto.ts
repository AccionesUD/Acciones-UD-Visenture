import { Type } from "class-transformer"
import { IsNotEmpty, IsNumber, IsString } from "class-validator"


class ItemsDto{
    @IsNumber()
    @IsNotEmpty()
    p: number
}


export class TradesLatestDto{
    @IsNotEmpty()
    @IsString()
    symbol: string

    @Type(() => ItemsDto)
    trade: Record<string, any>
}