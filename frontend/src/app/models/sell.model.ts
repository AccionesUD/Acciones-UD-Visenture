export interface SellOrder {
  symbol: string;
  qty: number;
  type: 'market' | 'limit' | 'stop' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: number;
  };
  stop_loss?: {
    stop_price: number;
    limit_price?: number;
  };
}

// Interface para la respuesta de la venta
export interface SellResponse {
  success: boolean;
  orderId?: string;
  status?: 'pending' | 'completed' | 'canceled'; // status de la orden
  message?: string;
  soldAt?: number; // filled_avg_price - Precio al que se vendió
  totalAmount?: number; // Cantidad total de la operación
  fee?: number; // Comisión de la operación
  submittedAt?: Date; // submitted_at - Fecha y hora de envío
  filledAt?: Date; // filled_at - Fecha y hora de completado
  filledQuantity?: number; // filled_quantity - Cantidad efectivamente ejecutada
  timestamp?: Date; // Para compatibilidad con código existente
}
