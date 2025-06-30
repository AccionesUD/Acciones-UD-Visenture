import { Account } from "src/accounts/entities/account.entity"
import { Share } from "src/shares/entities/shares.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { sideOrder } from "../enums/side-order.enum"
import { typeOrder } from "../enums/type-order.enum"
import { Exclude, Transform } from "class-transformer"
import { Commission } from "./comissions.entity"
import { OrderCommissions } from "./orders_commission.entity"
import { StatusEventsOrder } from "../enums/status-order.enum"
@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: string

    @CreateDateColumn({nullable: true})
    create_at: Date

    @Exclude()
    @UpdateDateColumn({nullable: true})
    update_at: Date

    @Column({ type: 'timestamp', nullable: true })
    filled_at?: Date

    @Column({ type: 'timestamp', nullable: true })
    canceled_at?: Date

    @Column({ type: 'timestamp', nullable: true })
    expired_at?: Date

    @ManyToOne(() => Share)
    @JoinColumn({ name: 'id_share' })
    share: Share

    @Column({ type: 'varchar', length: 10 })
    side: sideOrder

    @Column({ type: 'varchar', length: 20 })
    type: typeOrder

    @Column({ type: 'decimal', precision: 11, scale: 4, nullable: true })
    limit_price?: number

    @Column({ type: 'decimal', precision: 11, scale: 4, nullable: true })
    stop_price?: number

    @Column({ type: 'int' })
    qty: number

    @Column({
        type: 'int', nullable: true, transformer: {
            to: (value: number) => value,
            from: (value: string) => Number(value)
        }
    })
    fill_qyt?: number

    @Column({
        type: 'decimal', precision: 11, scale: 4, nullable: true, transformer: {
            to: (value: number ) => value,
            from: (value: string) => Number(value)
        }
    })
    filled_avg_price?: number

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'id_account' })
    account: Account

    @ManyToOne(() => Account, { nullable: true })
    @JoinColumn({ name: 'id_commissioner' })
    account_commissioner?: Account | null

    @Column({ type: 'varchar', length: 10, default: StatusEventsOrder.ACCEPTED })
    status: string

    @Column({ type: 'varchar', length: 10 })
    time_in_force: string

    @Exclude()
    @Column({ type: 'varchar', nullable: true })
    order_id_alpaca?: string | null

    @OneToMany(() => OrderCommissions, (OrderCommissions) => OrderCommissions.order)
    commissions: Commission[]

    @Column({ type: 'decimal', precision: 11, scale: 4, nullable: true })
    approximate_total: number
}