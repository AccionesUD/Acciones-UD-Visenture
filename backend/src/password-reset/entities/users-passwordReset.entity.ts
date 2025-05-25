import { User } from '../../users/users.entity';
import { Column, Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserPasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'identity_document', referencedColumnName: 'identity_document' })
  user: User;
}