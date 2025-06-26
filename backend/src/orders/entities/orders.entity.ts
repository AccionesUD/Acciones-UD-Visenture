import { Account } from "src/accounts/entities/account.entity"
import { Share } from "src/shares/entities/shares.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { sideOrder } from "../enums/side-order.enum"
import { typeOrder } from "../enums/type-order.enum"
import { Exclude, Transform } from "class-transformer"
import { Commission } from "./comissions.entity"
import { OrderCommissions } from "./orders_commission.entity"
@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: string

    @CreateDateColumn()
    create_at: Date

    @Exclude()
    @UpdateDateColumn()
    update_at: Date

    @Column({type: 'date', nullable: true})
    filled_at?: Date

    @ManyToOne(() => Share)
    @JoinColumn({name: 'id_share'})
    share: Share

    @Column({type: 'varchar', length: 10})
    side: sideOrder

    @Column({type: 'varchar', length: 20})
    type: typeOrder

    @Column({type: 'decimal', precision: 11, scale: 4, nullable: true})
    limit_price?: number

    @Column({type: 'decimal', precision: 11, scale: 4, nullable: true})
    stop_price?: number

    @Column({type: 'int'})
    qty: number

    @Column({type: 'int', nullable: true})
    fill_qyt?: number

    @Column({type: 'decimal', precision: 11, scale: 4, nullable: true})
    filled_avg_price?: string

    @ManyToOne(() => Account)
    @JoinColumn({name: 'id_account'})
    account: Account

    @ManyToOne(() => Account, {nullable: true})
    @JoinColumn({name: 'id_commissioner'})
    account_commissioner?: Account | null

    @Column({type: 'varchar', length: 10, default: 'pendiente'})
    status: string

    @Column({type: 'varchar', length: 10})
    time_in_force: string

    @Exclude()
    @Column({type: 'varchar', nullable: true})
    order_id_alpaca?: string | null

    @OneToMany(() => OrderCommissions, (OrderCommissions) => OrderCommissions.order)
    commissions: Commission[]

    @Column({type: 'decimal', precision: 11, scale: 4, nullable: true})
    approximate_total: number
}