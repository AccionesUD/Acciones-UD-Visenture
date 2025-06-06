import { Entity } from "typeorm";

@Entity()
export class Stock{
    mic: string  // codigo identificador de mercado 
    name_market: string
    country_region: string
    logo: string
    opening_time: string
    closing_time: string
    days_operation: string  // podria ser un enum 
}