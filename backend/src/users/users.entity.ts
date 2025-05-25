import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';

@Entity()
export class User {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  identity_document: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  first_name: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  last_name: string;

  @Column({ type: 'date', nullable: false })
  birthdate: Date;

  @Column({ type: 'varchar', length: 80, nullable: false })
  address: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  phone: string;

  @CreateDateColumn()
  register_date: Date;

  @UpdateDateColumn()
  update_date: Date;

  @OneToOne(() => Account, (account) => account.user)
  account: Account;
}
