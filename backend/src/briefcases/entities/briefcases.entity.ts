import { Account } from "src/accounts/entities/account.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from "typeorm"

/*
@Entity()
export class Briefcase{
    @PrimaryColumn()
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
}*/

