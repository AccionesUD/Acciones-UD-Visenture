export interface BuyOrder {
  stockId: string;
  stockSymbol: string;
  quantity: number;
  orderType: 'market' | 'limit' | 'stop-loss';
  price?: number;
  limitPrice?: number;
  timeInForce: 'day' | 'gtc' | 'ioc';
  extendedHours: boolean;
  clientId?: number; // ID del cliente si el comisionista está haciendo la orden para un cliente
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