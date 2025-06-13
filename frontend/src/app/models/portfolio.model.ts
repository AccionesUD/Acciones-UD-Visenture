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

// Interfaz para las acciones en el portafolio (no confundir con Stock que representa mercados)
export interface PortfolioShare {
  id: string;
  companyName: string;
  ticker: string;
  stockName: string;  // Nombre del mercado al que pertenece
  stockMic: string;   // MIC del mercado al que pertenece
  quantity: number;
  unitValue: number;
  totalValue: number;
  performance: number;
  color: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalEarnings: number;
  totalShares: number;  // Total de acciones diferentes
  totalValue: number;
  performance: number;
}

export interface PortfolioPosition {
  id: number;
  share: PortfolioShare;  // Acción
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentValue: number;
}

export interface Portfolio {
  id: number;
  userId: string;
  balance: number;
  positions: PortfolioPosition[];
  totalValue: number;
  totalInvested: number;
  performance: number;
}