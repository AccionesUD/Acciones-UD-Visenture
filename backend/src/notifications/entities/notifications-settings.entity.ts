import { Account } from 'src/accounts/entities/account.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

@Entity()
export class NotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Account, account => account.notificationSettings, { onDelete: 'CASCADE' })
  @JoinColumn()
  account: Account;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ default: false })
  whatsappEnabled: boolean;

  @Column({ nullable: true })
  phoneNumber: string; // Para SMS y WhatsApp
}