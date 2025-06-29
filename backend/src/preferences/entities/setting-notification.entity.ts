// src/preferences/entities/setting-notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SettingNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  notify_open_close_markets: boolean;

  @Column({ default: true })
  notify_daily_summary: boolean;

  @Column({ default: true })
  notify_execute_orders: boolean;

  @Column({ default: true })
  notify_price_alerts: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_change_time: Date;
}