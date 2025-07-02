
export const RoutesEndpointsMarket = {
    'quotesLatest': (symbol: string) => `/v2/stocks/quotes/latest?symbols=${symbol}`,
    'tradesLatest': (symbol: string) => `/v2/stocks/${symbol}/trades/latest`
}