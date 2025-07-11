// src/accounts/entities/account.entity.ts
import { User } from 'src/users/users.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/roles-permission/entities/role.entity';
import { PreferenceAccount } from 'src/preferences/entities/preference-account.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  last_access: Date;

  @Column({ type: 'int', nullable: true })
  commissioner: number;

  @Column({ type: 'varchar', nullable: true, unique: true, length: 50 })
  alpaca_account_id: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  identity_document: string;

  @OneToOne(() => User, (user) => user.account)
  @JoinColumn({
    name: 'identity_document',
    referencedColumnName: 'identity_document',
  })
  user: User;

  @ManyToMany(() => Role, (role) => role.accounts, { cascade: true })
  @JoinTable()
  roles: Role[];

  @OneToMany(() => Subscription, (subscription) => subscription.account)
  subscriptions: Subscription[];

  @OneToOne(() => PreferenceAccount, (preference) => preference.account, {
    cascade: true,
    eager: true, 
    onDelete: 'CASCADE', 
  })
  preference: PreferenceAccount;
}