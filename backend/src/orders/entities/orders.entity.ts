import { Account } from "src/accounts/entities/account.entity"
import { Entity } from "typeorm"
@Entity()
export class Order {
    id: string
    create_at: Date
    update_at: Date
    filled_at?: Date
    share: string
    side: string
    type: string
    limit_price?: string
    stop_price?: string
    qyt: number
    fill_qyt?: number
    filled_avg_price?: string
    account: Account
    account_commisioner?: Account
    status: string
    time_in_force: string
    order_id_alpaca?: string
}