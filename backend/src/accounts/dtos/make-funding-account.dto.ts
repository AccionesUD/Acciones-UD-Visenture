import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"

export class MakeFundignAccountDto{
    @IsNumber()
    @IsOptional()
    idAccount: number

    @IsString()
    @IsOptional()
    idAccountAlpaca: string

    @IsNumber()
    @IsNotEmpty()
    @Min(5)
    amountTranfer: number

    constructor(partial?: Partial<MakeFundignAccountDto>) {
        Object.assign(this, partial);
    }
}