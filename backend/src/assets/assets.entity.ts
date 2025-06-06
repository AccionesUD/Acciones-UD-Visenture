import { Stock } from "src/stocks/stocks.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity()
export class Asset{
   @PrimaryColumn()
   id: string   // puede ser el mismo de alca uuid o ser autoincrementable
   symbol: string
   name_share: string
   sector?: string
   tradable: boolean
   status: boolean

   @ManyToOne(() => Stock)
   @JoinColumn()
   stock: Stock 
}