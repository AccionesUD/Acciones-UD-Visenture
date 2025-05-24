import { User } from 'src/users/users.entitiy';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  password: string;

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  last_acces: Date;

  @Column({ type: 'int', nullable: true })
  commissioner: number;

  @OneToOne(() => User, (user) => user.account)
  @JoinColumn()
  @OneToOne(() => User, (user) => user.account)
  @JoinColumn({ name: 'identity_document' })
  user: User;
}
