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
  symbol: string;

  @Column()
  name_share: string;

  @Column({nullable: true})
  sector?: string;

  @Column()
  status: string;

  @Column()
  tradable: boolean;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'mic_stock_market', referencedColumnName: 'mic' }) // OJO: usa el campo correcto
  stock: Stock;
}
