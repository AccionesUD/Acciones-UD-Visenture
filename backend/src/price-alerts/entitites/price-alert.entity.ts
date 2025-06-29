// src/price-alerts/entities/price-alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Share } from 'src/shares/entities/shares.entity';
import { Account } from 'src/accounts/entities/account.entity';

export enum AlertDirection {
  ABOVE = 'above',
  BELOW = 'below'
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  CANCELLED = 'cancelled'
}

@Entity()
export class PriceAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Share)
  @JoinColumn({ name: 'share_id' })
  share: Share;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  target_price: number;

  @Column({
    type: 'enum',
    enum: AlertDirection,
    default: AlertDirection.ABOVE
  })
  direction: AlertDirection;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status: AlertStatus;

  @Column({ default: false })
  is_recurring: boolean; // Si es true, la alerta se reactiva después de dispararse

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  triggered_at: Date;
}