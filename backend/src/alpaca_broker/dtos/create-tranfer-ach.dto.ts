import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateTransferAchDto{

    @IsNotEmpty()
    transfer_type: string

    @IsNotEmpty()
    relationship_id: string

    @IsNotEmpty()
    @IsNumber()
    amount: number

    @IsNotEmpty()
    direction: string

     constructor(partial?: Partial<CreateTransferAchDto>) {
        Object.assign(this, partial);
    }
}