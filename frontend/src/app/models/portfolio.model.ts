export interface Stock {
  id: string;
  company: string;
  symbol: string;
  marketName: string; 
  marketId: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  performance: number;
  color: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalEarnings: number;
  totalStocks: number;
  totalValue: number;
  performance: number;
}