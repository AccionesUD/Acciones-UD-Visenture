import { Max, MAX, Min } from "class-validator";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./orders.entity";
import { OrderCommissions } from "./orders_commission.entity";
import { Exclude, Transform } from "class-transformer";

@Entity()
export class Commission {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: string

    @Column({ type: "varchar", length: 30 })
    name: string

    @Column({
        type: 'numeric', precision: 3, scale: 2,
        transformer: {
            from: (value: string | number) => {
                if (typeof value === 'string') {
                    return parseFloat(value);
                }
                return value;
            },
            to: (value: number) => {
                return value.toFixed(4);
            }
        }
    },)
    @Min(0)
    @Max(0.99)
    percent_value: number

    @OneToMany(() => OrderCommissions, (OrderCommissions) => OrderCommissions.commission)
    orders: OrderCommissions
}