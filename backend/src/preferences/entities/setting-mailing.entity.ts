//backend\src\notifications\entities\notifications-settings.entity.ts
import { Account } from 'src/accounts/entities/account.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { PreferenceAccount } from './preference-account.entity';

@Entity()
export class SettingMailing {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PreferenceAccount, preference => preference.setting_mailing, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'id_preference_account' })
  preference_account: PreferenceAccount;

  @Column({ default: true })
  email_enabled: boolean;  // Cambiado a snake_case para consistencia

  @Column({ default: false })
  sms_enabled: boolean;

  @Column({ default: false })
  whatsapp_enabled: boolean;

  @Column({ nullable: true })
  phone_number: string;  // Cambiado a snake_case

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  last_change_time: Date;  // Añadido para consistencia con otras entidades
}