// src/password-reset/entities/password-reset-token.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { User } from '../../users/users.entity';

@Entity()
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  token: string;

  @Column()
  email: string;
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({type:"boolean", default: false })
  used: boolean;
}