
export const RoutesEndpointsBroker = {
    'createAccount': '/v1/accounts',
    'createOrder': (account_id: string) => `/v1/trading/accounts/${account_id}/orders`,
    'cancelOrder': (order_id_alpaca: string, account_id: string) => `/v1/trading/accounts/${account_id}/orders/${order_id_alpaca}`
}