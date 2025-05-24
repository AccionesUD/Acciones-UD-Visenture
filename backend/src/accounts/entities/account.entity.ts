import { User } from "src/users/users.entitiy";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Account{

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: 'varchar',
        nullable: false,
        length: 30,
        unique: true
    })
    email: string

    @Column({
        type: 'varchar',
        nullable: false
    })
    password: string

    @CreateDateColumn()
    date_created: Date

    @UpdateDateColumn()
    last_acces: Date

    @OneToOne(() => Account)
    @JoinColumn()
    commissioner: number

    @OneToOne(() => User, {nullable: true})
    @JoinColumn()
    identity_document : string
}