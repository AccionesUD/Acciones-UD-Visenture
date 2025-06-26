import { Expose, Type } from "class-transformer"
import { IsNotEmpty } from "class-validator"

class ItemsDto{
    @Expose()
    @IsNotEmpty()
    "ap": number
    @Expose()
    @IsNotEmpty()
    "bp": number
}

export class QuoteLatestDto{
    @Type(() => ItemsDto)
    quotes: Record<string, ItemsDto>
}

