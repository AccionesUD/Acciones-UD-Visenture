import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Stock } from 'src/stocks/entities/stocks.entity';

@Entity()
export class Share {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  class: string;

  @Column()
  ticker: string;

  @Column()
  name_share: string;

  @Column()
  sector: string;

  @Column()
  status: boolean;

  @Column()
  tradable: boolean;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'mic_stock_market', referencedColumnName: 'mic' }) // OJO: usa el campo correcto
  stock: Stock;
}
