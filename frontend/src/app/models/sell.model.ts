// Interface para la orden de venta (basada en el modelo de datos)
export interface SellOrder {
  stockId: string; // ticket_share - Código de la acción
  stockSymbol?: string; // Para mostrar información adicional
  quantity: number; // share_quantity - Cantidad de acciones
  price?: number; // Precio actual de referencia
  orderType: 'market' | 'limit' | 'stop-loss' | 'take-profit'; // type_order_type
  limitPrice?: number; // Para órdenes con precio límite
  accountId?: string; // id_account - cuenta desde la cual se ejecuta la orden
  timeInForce?: 'day' | 'gtc' | 'ioc'; // time_in_force - Vigencia de la orden
  extendedHours?: boolean; // extended_hours - Operación fuera de horario regular
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