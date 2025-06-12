import { Type } from "class-transformer"
import { Account } from "src/accounts/entities/account.entity"
import { Share } from "src/shares/entities/shares.entity"
import { sideOrder } from "../enums/side-order.enum"
import { IsEnum, IsInt, isNotEmpty, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches, ValidateIf } from "class-validator"
import { typeOrder } from "../enums/type-order.enum"

export class OrderDto{
    @IsNotEmpty()
    symbol: string

    @IsEnum(sideOrder)
    @IsNotEmpty()
    side: sideOrder

    @IsEnum(typeOrder)
    @IsNotEmpty()
    type: string

    @IsInt()
    @IsNotEmpty()
    qty: number

    @IsString()
    @IsOptional()
    account?: number

    @IsString()
    @IsOptional()
    account_commisioner?: string

    @IsString()
    @IsNotEmpty()
    time_in_force: string

    @ValidateIf(o => o.type === typeOrder.LIMIT)
    @IsNotEmpty()
    @IsNumberString({ no_symbols: true }, { message: 'El valor debe ser un número sin símbolos' })
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'El valor monetario debe tener como máximo dos decimales' })
    limit_price: string

    @ValidateIf(o => o.type === typeOrder.STOP)
    @IsNotEmpty()
    @IsNumberString({ no_symbols: true }, { message: 'El valor debe ser un número sin símbolos' })
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'El valor monetario debe tener como máximo dos decimales' })
    stop_price: string

}