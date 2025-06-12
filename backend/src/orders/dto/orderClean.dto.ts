import { Account } from "src/accounts/entities/account.entity";
import { sideOrder } from "../enums/side-order.enum";
import { Exclude, Expose } from "class-transformer";


class BaseOrder {
    @Expose()
    symbol: string;
    @Expose()
    side: sideOrder;
    @Expose()
    qty: number;
    @Expose()
    account: string;
    @Expose()
    account_commisioner?: string;
    @Expose()
    time_in_force?: string;
    @Expose()
    type: string
}

export class MarketOrdeDto extends BaseOrder {
    
}

export class LimitOrderDto extends BaseOrder {
    @Expose()
    limit_order: string
}

export class StopOrderDto extends BaseOrder {
    @Expose()
    stop_price: string
}