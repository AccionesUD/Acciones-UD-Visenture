/**
 * Modelos para la gestión de carteras de clientes por parte del comisionista
 */

export interface ClientSharePosition {
  symbol: string;         // Símbolo de la acción (ticker)
  name: string;           // Nombre de la compañía
  quantity: number;       // Cantidad de acciones
  purchase_price: number; // Precio de compra promedio
  current_price: number;  // Precio actual
  market_value: number;   // Valor de mercado actual (cantidad * precio actual)
  total_return: number;   // Ganancia/pérdida total
  return_percentage: number; // Porcentaje de retorno
  last_updated: string;   // Fecha de última actualización
  exchange?: string;      // Mercado donde cotiza la acción
  currency?: string;      // Moneda en la que cotiza
}

export interface ClientPortfolio {
  clientId: number;       // ID del cliente
  clientName: string;     // Nombre del cliente
  positions: ClientSharePosition[]; // Posiciones del cliente
  totalValue: number;     // Valor total del portafolio
  totalInvested: number;  // Total invertido
  totalReturn: number;    // Ganancia/pérdida total
  returnPercentage: number; // Porcentaje de retorno global
}

export interface ClientPortfolioResponse {
  success: boolean;
  data?: ClientPortfolio;
  message?: string;
  error?: string;
}
