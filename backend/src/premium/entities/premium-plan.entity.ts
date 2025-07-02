import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class PremiumPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 30 })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  duration_days: number;

  @Column({ nullable: true, length: 150 })
  description?: string;
}
