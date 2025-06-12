import { Type } from "class-transformer";
import { IsArray, IsDateString, isDateString, IsEmail, IsNumber, ValidateNested } from "class-validator";
import e from "express";

export class contact{
    email_address: string
    phone_number: string
    street_address: string
    city: string
}

export class identity{
    given_name: string
    family_name: string
    date_of_birth: Date
    tax_id: string
    tax_id_type: string
    country_of_tax_residence: string
}

export class disclosures{
    is_control_person: boolean
    is_affiliated_exchange_or_finra: boolean
    is_politically_exposed: boolean
    immediate_family_exposed: boolean
}

export class agreementsItem{
    agreement: string
    @IsDateString()
    signed_at: string
    ip_address: string
}


export class CreateAccountAlpacaDto{
    @Type(() =>  contact)
    @ValidateNested()
    contact: contact

    @Type(() =>  identity)
    @ValidateNested()
    identity: identity

    @Type(() =>  disclosures)
    @ValidateNested()
    disclosures: disclosures

    @ValidateNested()
    @Type(() =>  agreementsItem)
    agreements: [agreementsItem]
}