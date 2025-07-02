// src/subscriptions/entities/subscription.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { PremiumPlan } from 'src/premium/entities/premium-plan.entity';

// src/subscriptions/entities/subscription.entity.ts
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
}

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Account, (account) => account.subscriptions, { eager: true })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => PremiumPlan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: PremiumPlan;

  @CreateDateColumn()
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;
}
