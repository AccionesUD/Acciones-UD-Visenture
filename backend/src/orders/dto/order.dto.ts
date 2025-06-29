import { Type } from "class-transformer"
import { Account } from "src/accounts/entities/account.entity"
import { Share } from "src/shares/entities/shares.entity"
import { sideOrder } from "../enums/side-order.enum"
import { IsEnum, IsInt, isNotEmpty, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches, Max, min, Min, ValidateIf } from "class-validator"
import { typeOrder } from "../enums/type-order.enum"

export class OrderDto{
    @IsNotEmpty()
    symbol: string 

    @IsOptional()
    share: Share

    @IsEnum(sideOrder)
    @IsNotEmpty()
    side: sideOrder

    @IsEnum(typeOrder)
    @IsNotEmpty()
    type: typeOrder

    @IsInt()
    @Min(1)
    @IsNotEmpty()
    qty: number

    @IsString()
    @IsOptional()
    account: Account

    @IsString()
    @IsOptional()
    account_commissioner?: number 

    @IsString()
    @IsNotEmpty()
    time_in_force: string

    @ValidateIf(o => o.type === typeOrder.LIMIT)
    @IsNotEmpty()
    @Min(1)
    @Max(9999)
    limit_price: number

    @ValidateIf(o => o.type === typeOrder.STOP)
    @IsNotEmpty()
    @Min(1)
    @Max(9999)
    stop_price: number

}