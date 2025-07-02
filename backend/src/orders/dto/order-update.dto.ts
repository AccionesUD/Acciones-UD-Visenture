import { Type } from "class-transformer"
import { Account } from "src/accounts/entities/account.entity"
import { Share } from "src/shares/entities/shares.entity"
import { sideOrder } from "../enums/side-order.enum"
import { IsDate, IsEnum, IsInt, isNotEmpty, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Matches, Max, min, Min, ValidateIf } from "class-validator"
import { typeOrder } from "../enums/type-order.enum"
import { StatusEventsOrder } from "../enums/status-order.enum"

export class OrderUpdateDto {
    @IsNotEmpty()
    @IsString()
    order_id_alpaca: string

    @IsOptional()
    @IsDate()
    filled_at?: Date | null

    @IsOptional()
    @IsDate()
    canceled_at?: Date | null

    @IsOptional()
    @IsDate()
    expired_at?: Date | null


    @IsOptional()
    fill_qyt?: number

    @IsOptional()
    @IsNumber()
    filled_avg_price?: number

    @IsNotEmpty()
    @IsEnum(StatusEventsOrder)
    status: StatusEventsOrder

    constructor(partial?: Partial<OrderUpdateDto>) {
        Object.assign(this, partial);
    }
}