import { Account } from "src/accounts/entities/account.entity"
import { typeTransaction } from "../enums/type-transaction.enum"
import { IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { statusTransaction } from "../enums/status-transaction.enum"

export class UpdateTransactionDto{
    
    @IsEnum(statusTransaction)
    @IsOptional()
    status?

    @IsString()
    @IsOptional()
    operation_id?: string

    constructor(partial?: Partial<UpdateTransactionDto>) {
        Object.assign(this, partial);
    }
}