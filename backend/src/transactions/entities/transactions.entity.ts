import { Account } from "src/accounts/entities/account.entity";
import { Column, CreateDateColumn, Decimal128, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { typeTransaction } from "../enums/type-transaction.enum";
import { statusTransaction } from "../enums/status-transaction.enum";
import { CreateAccountDto } from "src/accounts/dtos/create-account.dto";
import { Exclude } from "class-transformer";

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: string

    @Column({ type: "varchar", length: 30 })
    type_transaction: typeTransaction

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'account_id' })
    account: Account

    @Column({
        type: 'numeric',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => Number(value)
        }
    })
    value_transaction: number

    @CreateDateColumn()
    date_create: Date

    @UpdateDateColumn()
    date_update: Date

    @Exclude()
    @Column({ type: 'varchar', length: 80, unique: true })
    operation_id: string

    @Column({ type: 'varchar', length: 30, default: statusTransaction.PENDING })
    status: statusTransaction
}