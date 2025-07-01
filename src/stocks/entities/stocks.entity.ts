//backend\src\stocks\entities\stocks.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Stock {
  @PrimaryColumn() // OBLIGATORIO
  mic: string; // código identificador de mercado

  @Column()
  name_market: string;
  @Column()
  country_region: string;
  @Column()
  logo: string;
  @Column()
  opening_time: string;
  @Column()
  closing_time: string;
  @Column()
  days_operation: string; // puede ser enum
}
