export interface Market {
  // Campos que vienen directamente del backend (según MarketDto)
  symbol: string;               // Identificador único del mercado (ticker, ej: 'AAPL', 'MSFT')
  name: string;                 // Nombre completo del mercado o empresa
  isActive: boolean;            // Indica si el mercado/acción está activo
  country?: string;             // País donde se ubica el mercado (opcional)
  currency: string;             // Moneda principal utilizada
  status: string;               // Estado del mercado/acción (active, inactive, etc.)
  price?: number;               // Precio actual de la acción (opcional)
  
  // Campos calculados o generados por el frontend
  id?: string;                  // Copia del symbol, para compatibilidad con el router y componentes
  description?: string;         // Descripción generada a partir de los datos del backend
  
  // Campos para compatibilidad (no usar en nuevo código)
  openingTime?: string;         // NO DISPONIBLE en el backend 
  closingTime?: string;         // NO DISPONIBLE en el backend
  timezone?: string;            // NO DISPONIBLE en el backend
  iconUrl?: string;             // NO DISPONIBLE en el backend
  
  // Datos financieros detallados (NO DISPONIBLES en el backend actual)
  dayChange?: number;           // NO DISPONIBLE en el backend
  weekChange?: number;          // NO DISPONIBLE en el backend
  monthChange?: number;         // NO DISPONIBLE en el backend
  yearChange?: number;          // NO DISPONIBLE en el backend
  volume?: number;              // NO DISPONIBLE en el backend
  marketCap?: number;           // NO DISPONIBLE en el backend
  peRatio?: number;             // NO DISPONIBLE en el backend
  dividend?: number;            // NO DISPONIBLE en el backend
  historicalPrices?: Array<{date: string, price: number}>; // NO DISPONIBLE en el backend
}