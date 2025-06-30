import { Type } from "class-transformer";
import { IsNotEmpty } from "class-validator";
import { Account } from "src/accounts/entities/account.entity";

export class CreateBriefcaseDto{
    @IsNotEmpty()
    @Type(() => Account)
    account: Account

    constructor(partial?: Partial<CreateBriefcaseDto>) {
        Object.assign(this, partial);
    }
}