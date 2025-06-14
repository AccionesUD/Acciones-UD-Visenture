import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator"

export class MakeFundignAccountDto{
    @IsString()
    @IsNotEmpty()
    idAccountAlpaca: string

    @IsNumber()
    @IsOptional()
    @Min(5)
    amountTranfer: number


    constructor(partial?: Partial<MakeFundignAccountDto>) {
        Object.assign(this, partial);
    }
}