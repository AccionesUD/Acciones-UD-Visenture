// account.entity.ts
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
import { NotificationSettings } from 'src/notifications/entities/notifications-settings.entity';

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

  // Agrega la columna foránea explícita:
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

  @OneToOne(() => NotificationSettings, settings => settings.account, { 
    cascade: true,
    eager: true // Cargar siempre con la cuenta
  })
  notificationSettings: NotificationSettings;

  // Relación uno-a-muchos con Subscription
  @OneToMany(() => Subscription, (subscription) => subscription.account)
  subscriptions: Subscription[];
}
