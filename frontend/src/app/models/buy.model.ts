export interface BuyOrder {
  symbol: string; // stockSymbol
  qty: number; // quantity
  side: 'buy';
  type: 'market' | 'limit' | 'stop-loss';
  time_in_force: 'day' | 'gtc' | 'ioc';
  account_commissioner?: string; // ID del comisionista si aplica
  limit_price?: number; // Solo para órdenes limit/stop-loss
}

export interface BuyResponse {
  success: boolean;
  message?: string;
  status: 'completed' | 'pending' | 'canceled';
  orderId: string;
  filledQuantity?: number;
  boughtAt?: number;
  totalAmount?: number;
  fee?: number;
  submittedAt: Date;
  filledAt?: Date;
}