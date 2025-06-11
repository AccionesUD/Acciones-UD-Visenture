import { Stock } from 'src/stocks/entities/stocks.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column, OneToOne, OneToMany, Index } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';

/*
@Entity()
export class Asset {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Briefcase, (briefcase) => briefcase.assets)
  @JoinColumn({ name: 'id_account' })
  briefcase: Briefcase;

  @Index('IDX_UNIQUE_ORDER', ['order'], { unique: true })
  @ManyToOne(() => Order, (order) => order)
  @JoinColumn({ name: 'id_order' })
  order: Order

  @Column({
    type: 'int',
    nullable: false
  })
  currentShareQuantity: number;

  @Column({
    type: 'int',
    nullable: false
  })
  buy_quantity: string

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: false
  })
  buy_avg_price: string

  @Column({
    type: 'varchar',
    nullable: false,
    length: 5
  })
  ticket_share: string
}*/
