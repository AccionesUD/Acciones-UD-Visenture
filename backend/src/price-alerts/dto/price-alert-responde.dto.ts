// src/price-alerts/dto/price-alert-response.dto.ts
export class PriceAlertResponseDto {
  id: number;
  symbol: string;         // Símbolo de la acción
  name: string;           // Nombre de la acción
  target_price: number;   // Precio objetivo
  direction: string;      // 'above' o 'below'
  status: string;         // Estado de la alerta
  is_recurring: boolean;  // Si es recurrente
  created_at: Date;       // Fecha de creación
  triggered_at: Date | null; // Fecha de activación (si aplica)
  market_name?: string;   // Nombre del mercado (opcional)
}