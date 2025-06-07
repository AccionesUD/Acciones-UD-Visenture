import { IsNotEmpty } from "class-validator"

export class CreateACHRelationDto {
    @IsNotEmpty()
    account_owner_name: string

    @IsNotEmpty()
    bank_account_type: string

    @IsNotEmpty()
    bank_account_number: string

    @IsNotEmpty()
    bank_routing_number: string

    @IsNotEmpty()
    nickname: string

    constructor(partial?: Partial<CreateACHRelationDto>) {
        Object.assign(this, partial);
    }
}