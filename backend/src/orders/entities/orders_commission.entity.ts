import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./orders.entity";
import { Commission } from "./comissions.entity";
import { Exclude } from "class-transformer";

@Entity()
export class OrderCommissions{
    @Exclude()
    @PrimaryGeneratedColumn()
    id: string
  
    @ManyToOne(() => Order, { cascade: true})
    @JoinColumn({name: 'id_order'})
    order: Order

    @ManyToOne(() => Commission, (Comissions) => (Comissions.orders_commission), {cascade: true, eager: true})
    @JoinColumn({name: 'id_commission'})
    commission: Commission

    @Column({type: 'decimal', precision: 11, scale: 4, nullable: true,
        transformer: {
            from: (value: string | number) => {
                if (typeof value === 'string') {
                    return parseFloat(value);
                }
                return value;
            },
            to: (value: number) => {
                return value.toFixed(2); 
            }
        }
    })
    ammount_commission: number
}