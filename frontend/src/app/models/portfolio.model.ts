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

export interface PortfolioPosition {
  id: string;
  stock: Stock;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentValue: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  balance: number;
  positions: PortfolioPosition[];
  totalValue: number;
  totalInvested: number;
  performance: number;
}