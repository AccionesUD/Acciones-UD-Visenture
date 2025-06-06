import { Stock } from 'src/stocks/stocks.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';

@Entity()
export class Asset {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'id_account' })
  account: Account;

  @Column()
  symbol: string;

  @Column()
  name_share: string;

  @Column({ nullable: true })
  sector?: string;

  @Column()
  tradable: boolean;

  @Column()
  status: boolean;

  @Column({ name: 'current_share_quantity', type: 'int' })
  currentShareQuantity: number;

  @ManyToOne(() => Stock)
  @JoinColumn()
  stock: Stock;
}
