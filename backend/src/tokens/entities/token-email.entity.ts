// src/tokens/entities/login-token.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { typesToken } from '../enums/tokenType.enum';

@Entity()
export class tokenEmail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;
 
  @Column({type:'varchar'})
  typeToken: typesToken // esto es un objeto de un enum creado en auth/enum/typeToken
}
