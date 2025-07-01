import { Account } from "src/accounts/entities/account.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Asset } from "./assets.entity"

@Entity()
export class Briefcase{
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    create_data: Date

    @Column({
        type: Boolean,
        default: true
    })
    status: boolean

    @OneToOne(() => Account)
    @JoinColumn({name: 'id_account'})
    account: Account
    
    @OneToMany(() => Asset, (asset) => asset.briefcase)
    assets: [Asset]
}

