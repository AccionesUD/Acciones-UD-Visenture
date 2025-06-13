import { Stock } from './stock.model';

// Modelo para la entidad acciones (shares) en el backend
export interface Share {
  id?: number;                // ID de la acción en la base de datos
  symbol: string;             // Símbolo de la acción (ej: 'AAPL')
  ticker?: string;            // Alias para símbolo, opcional
  class?: string;             // Clase de la acción (ej: 'common', 'preferred')
  name_share: string;         // Nombre de la acción/empresa
  sector: string | null;      // Sector al que pertenece la acción
  status: 'active' | 'inactive'; // Estado de la acción
  tradable: boolean;          // Si la acción se puede negociar
  stock?: Stock;              // Mercado al que pertenece (relación con Stock)
}

// Modelo para crear una nueva acción
export interface CreateShareDto {
  // Campo para el endpoint simplificado (POST /api/shares/new/)
  symbol?: string;          // Símbolo de la acción para creación simplificada
  
  // Campos para el endpoint completo
  class?: string;
  ticker?: string;
  name_share?: string;
  sector?: string;
  status?: boolean;
  tradable?: boolean;
  mic_stock_market?: string;
}

// Modelo para datos de precio/barra desde Alpaca
export interface StockBar {
  t: string;     // Timestamp
  o: number;     // Open price
  h: number;     // High price
  l: number;     // Low price
  c: number;     // Close price
  v: number;     // Volume
}
