import { Stock } from 'src/stocks/stocks.entity';
import { Entity, JoinColumn, ManyToOne, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;  // Mantener como número

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'id_account' })
  account: Account;

  @Column()
  symbol: string;

  @Column({ name: 'name_share' })
  name_share: string; 

  @Column({ nullable: true })
  sector?: string;

  @Column()
  tradable: boolean;

  @Column()
  status: string;  

  @Column({ name: 'current_share_quantity', type: 'int', default: 0 })
  currentShareQuantity: number;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;  // Relación con Stock
}