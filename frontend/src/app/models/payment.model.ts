/**
 * Modelo para representar pagos y transacciones de fondos
 * Basado en la estructura de la tabla Payment del diagrama relacional
 */
export interface Payment {
  id?: number;
  id_order?: number;
  id_commission?: number;
  order_value?: number;
  amount: number;
  status: PaymentStatus;
  description?: string;
  date_created: Date;
  date_payment?: Date;
}

/**
 * Estados posibles para un pago
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

/**
 * Modelo para la respuesta de la API al crear o actualizar un pago
 */
export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: Payment;
}

/**
 * Modelo para solicitar añadir fondos a la cuenta
 */
export interface AddFundsRequest {
  amount: number;
  payment_method: PaymentMethod;
  description?: string;
}

/**
 * Métodos de pago disponibles
 */
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'paypal' | 'other';

/**
 * Modelo para la información de una cuenta con su balance
 */
export interface AccountBalance {
  id?: number;
  user_id: number;
  balance: number;
  available_balance: number;
  pending_funds?: number;
  last_deposit?: {
    amount: number;
    date: Date;
    status: PaymentStatus;
  };
  currency: string;
  updated_at: Date;
}
