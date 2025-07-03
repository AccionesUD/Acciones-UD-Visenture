import { Injectable } from '@nestjs/common';
import { share } from 'rxjs';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { ListDataAnalyticsDto } from 'src/admin-analytics/dtos/list-data-analytics.dto';
import { BriefcaseService } from 'src/briefcases/services/briefcases.service';
import { OrderCommissions } from 'src/orders/entities/orders_commission.entity';
import { sideOrder } from 'src/orders/enums/side-order.enum';
import { StatusEventsOrder } from 'src/orders/enums/status-order.enum';
import { OrdersService } from 'src/orders/providers/orders.service';
import { ListRoles } from 'src/roles-permission/enums/list-roles.enum';
import { statusShares } from 'src/shares/consts/status-shares.consts';
import { SharesService } from 'src/shares/services/shares.service';
import { typeTransaction } from 'src/transactions/enums/type-transaction.enum';
import { TransactionsService } from 'src/transactions/services/transaction.service';
import { Transaction } from 'typeorm';

@Injectable()
export class AdminAnalyticsService {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly transactionService: TransactionsService,
        private readonly briefcaseService: BriefcaseService,
        private readonly sharesService: SharesService,
        private readonly accountService: AccountsService,


    ) { }

    async getDataAnalytics() {
        const [orders, transactions, briefcases, shares, accounts, commissions] = await Promise.all([
            this.ordersService.getAllOrders(),
            this.transactionService.getAllTransactionsUsers(),
            this.briefcaseService.getAllBriefcases(),
            this.sharesService.findAll(),
            this.accountService.getAllAccounts(),
            this.ordersService.getAllCommissionsOrder()
        ]);


        const response = new ListDataAnalyticsDto();

        const ordersFilled = orders.filter(order => order.status === StatusEventsOrder.FILLED);
        response.qty_orders_fill = ordersFilled.length;

        const validStatuses = [StatusEventsOrder.DONE_FOR_DAY, StatusEventsOrder.ACCEPTED];
        response.qty_orders_in_procces = orders.filter(order =>
            validStatuses.includes(order.status as StatusEventsOrder)
        ).length

        response.qty_orders_canceled= orders.filter(order => order.status === StatusEventsOrder.CANCELED
        ).length

        response.qty_orders_total = orders.length

        response.qty_order_buy = orders.filter(order => order.side === sideOrder.BUY).length;
        response.qty_order_sell = orders.filter(order => order.side === sideOrder.SELL).length;

        response.qty_recharges_in_accounts = transactions.filter(transaction =>
            transaction.type_transaction === typeTransaction.RECHARGE
        ).length;

        let transactionsRecharge = transactions.filter((transaction) => transaction.type_transaction == typeTransaction.RECHARGE)
        response.total_recharge_app = transactionsRecharge.reduce((sum, transaction) =>
            sum + transaction.value_transaction, 0);


        let ordersCommissionFilled = commissions.filter(commissions => commissions.order.status == StatusEventsOrder.FILLED)
        response.total_commission_app = ordersCommissionFilled.reduce((sum, order) => sum + order.ammount_commission, 0)

        response.total_assets_in_briefcases = briefcases.reduce((sum, b) =>
            sum + (b.assets?.length || 0), 0);

        response.qty_shares_in_operation = shares.filter(share =>
            share.status === statusShares.ACTIVE).length;

        response.qty_account_commission = accounts.filter(account =>
            account.roles?.some(role => role.name === ListRoles.COMISIONISTA)).length;


        response.qty_accounts_standard = accounts.filter(account =>
            account.roles?.some(role => role.name === ListRoles.USUARIO)).length;

        return response;
    }

}
