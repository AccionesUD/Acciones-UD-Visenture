// src/preferences/entities/setting-operation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SettingOperation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, default: 'limit' })
  type_order_type: string;

  @Column({ default: 10000 })
  daily_trading_limit: number;

  @Column({ default: true })
  activate_security_big_order: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_change_time: Date;
}