import { Account } from "src/accounts/entities/account.entity"
import { typeTransaction } from "../enums/type-transaction.enum"
import { IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { statusTransaction } from "../enums/status-transaction.enum"

export class CreateTransactionDto{
    @IsNotEmpty()
    @Type(() => Account)
    account: Account

    @IsNotEmpty()
    value_transaction: number

    @IsEnum(typeTransaction)
    @IsNotEmpty()
    type_transaction: typeTransaction

    @IsEnum(statusTransaction)
    @IsOptional()
    status: statusTransaction

    @IsString()
    @IsOptional()
    operation_id?: string

    constructor(partial?: Partial<CreateTransactionDto>) {
        Object.assign(this, partial);
    }
}