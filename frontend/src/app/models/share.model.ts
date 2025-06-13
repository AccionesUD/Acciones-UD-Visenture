// Modelo para la entidad acciones (shares) en el backend
export interface Share {
  id?: number;              // ID de la acción en la base de datos
  class: string;            // Clase de acción (ej: 'Common Stock')
  ticker: string;           // Símbolo/ticker de la acción (ej: 'AAPL')
  name_share: string;       // Nombre de la acción/empresa
  sector: string;           // Sector al que pertenece la acción
  status: boolean;          // Estado activo/inactivo
  tradable: boolean;        // Si la acción se puede negociar
  stock?: any;              // Mercado al que pertenece (relación con Stock)
  mic_stock_market: string; // Código MIC del mercado asociado
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
