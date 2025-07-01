// src/market/interfaces/market-data.interface.ts
export interface MarketData {
  symbol: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  timestamp: string;
}
