import { Stock } from 'src/stocks/entities/stocks.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column, OneToOne, OneToMany, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { Briefcase } from './briefcases.entity';
import { Order } from 'src/orders/entities/orders.entity';
import { Expose, Transform } from 'class-transformer';


@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => Briefcase, (briefcase) => briefcase.assets)
  @JoinColumn({ name: 'id_briefcase8' })
  briefcase: Briefcase;

  @Index('IDX_UNIQUE_ORDER', ['order'], { unique: true })
  @ManyToOne(() => Order, (order) => order, {eager: true})
  @JoinColumn({ name: 'id_order' }, )
  order: Order

  @Column({
    type: 'int',
    nullable: false
  })
  currentShareQuantity: number;

  @Expose()
  @Transform(({ value }) => parseFloat(value.toFixed(2)))
  percentGainLose: number

  @Expose()
  returnOfMoney: number

  @Column({
    type: 'varchar',
    nullable: false,
    length: 5
  })
  ticket_share: string
}
