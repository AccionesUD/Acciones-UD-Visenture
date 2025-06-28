// src/preferences/entities/preference-account.entity.ts
import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { SettingNotification } from './setting-notification.entity';
import { SettingOperation } from './setting-operation.entity';
import { SettingBriefcase } from './setting-briefcase.entity';
import { SettingMailing } from './setting-mailing.entity';

@Entity()
export class PreferenceAccount {
  @PrimaryColumn()
  id_account: number;

  @OneToOne(() => Account, account => account.preference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_account' })
  account: Account;

  @OneToOne(() => SettingNotification, { cascade: true, eager: true })
  @JoinColumn({ name: 'id_setting_notification' })
  setting_notification: SettingNotification;

  @OneToOne(() => SettingOperation, { cascade: true, eager: true })
  @JoinColumn({ name: 'id_setting_operation' })
  setting_operation: SettingOperation;

  @OneToOne(() => SettingBriefcase, { cascade: true, eager: true })
  @JoinColumn({ name: 'id_setting_briefcase' })
  setting_briefcase: SettingBriefcase;

  @OneToOne(() => SettingMailing, { cascade: true, eager: true })
  @JoinColumn({ name: 'id_setting_mailing' })
  setting_mailing: SettingMailing;
}