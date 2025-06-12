export interface BuyOrder {
  stockId: string;
  stockSymbol: string;
  quantity: number;
  orderType: 'market' | 'limit' | 'stop-loss';
  price?: number;
  limitPrice?: number;
  timeInForce: 'day' | 'gtc' | 'ioc';
  extendedHours: boolean;
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