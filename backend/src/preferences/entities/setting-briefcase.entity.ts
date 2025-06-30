// src/preferences/entities/setting-briefcase.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SettingBriefcase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, default: 'grid' })
  display_type: string;

  @Column({ length: 20, default: 'all' })
  filter_order_type: string;

  @Column({ default: true })
  show_lower_assets: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_change_time: Date;
}