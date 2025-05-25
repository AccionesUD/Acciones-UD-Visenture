// src/tokens/entities/login-token.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class LoginToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;
  
  @Column({ default: 0 })
  resendCount: number;
  
  @Column({ nullable: true })
  lastResendAt: Date;
}
