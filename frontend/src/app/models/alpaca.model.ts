// Parámetros comunes para todos los endpoints que retornan datos históricos
export interface AlpacaBaseParams {
  start?: string;           // Fecha inicial (ISO)
  end?: string;             // Fecha final (ISO)
  limit?: number;           // Límite de resultados
  page_token?: string;      // Token para paginación
}

// Parámetros específicos para barras históricas
export interface AlpacaBarsParams extends AlpacaBaseParams {
  timeframe?: string;       // Timeframe: 1Min, 5Min, 15Min, 1Hour, 1Day, etc.
  adjustment?: 'raw' | 'split' | 'dividend' | 'all'; // Ajustes a aplicar
  feed?: 'sip' | 'iex' | 'otc';  // Fuente de datos
  sort?: 'asc' | 'desc';    // Orden de resultados
}

// Parámetros para subastas
export interface AlpacaAuctionsParams extends AlpacaBaseParams {
  feed?: 'sip' | 'iex';
  sort?: 'asc' | 'desc';
}

// Parámetros para trades
export interface AlpacaTradesParams extends AlpacaBaseParams {
  feed?: 'sip' | 'iex' | 'otc';
  sort?: 'asc' | 'desc';
}

// Parámetros para quotes
export interface AlpacaQuotesParams extends AlpacaBaseParams {
  feed?: 'sip' | 'iex' | 'otc';
  sort?: 'asc' | 'desc';
}

// Parámetros para noticias
export interface AlpacaNewsParams {
  symbols?: string[];       // Símbolos de acciones
  start?: string;           // Fecha inicial (ISO)
  end?: string;             // Fecha final (ISO)
  limit?: number;           // Límite de resultados (default: 10, max: 50)
  sort?: 'asc' | 'desc';    // Orden de resultados (default: desc)
  include_content?: boolean; // Incluir contenido completo
  exclude_contentless?: boolean; // Excluir noticias sin contenido
  page_token?: string;      // Token para paginación
}

// Parámetros para assets
export interface AlpacaAssetsParams {
  status?: 'active' | 'inactive'; // Estado del activo
  asset_class?: string;     // Clase de activo (ej: 'us_equity')
  exchange?: string;        // Exchange específico
  symbols?: string;         // Lista de símbolos separados por comas
}

// Interfaces para respuestas de la API

// Respuesta de barras (v2/stocks/{symbol}/bars)
export interface AlpacaBarsResponse {
  bars: {
    [symbol: string]: {
      t: string;         // Timestamp
      o: number;         // Open Price
      h: number;         // High Price
      l: number;         // Low Price
      c: number;         // Close Price
      v: number;         // Volume
      n?: number;        // Trade Count (opcional)
      vw?: number;       // Volume Weighted Average Price (opcional)
    }[]
  };
  next_page_token?: string;
}

// Respuesta de subastas (v2/stocks/{symbol}/auctions)
export interface AlpacaAuctionsResponse {
  auctions: {
    Timestamp: string;
    Price: number;
    Size: number;
    Type: string;
    Condition: string;
  }[];
  symbol: string;
  next_page_token?: string;
}

// Respuesta de quotes (v2/stocks/{symbol}/quotes)
export interface AlpacaQuoteResponse {
  quote: {
    Timestamp: string;
    AskPrice: number;
    AskSize: number;
    BidPrice: number;
    BidSize: number;
    Conditions?: string[];
  };
  symbol: string;
}

// Respuesta de trades (v2/stocks/{symbol}/trades)
export interface AlpacaTradesResponse {
  trades: {
    Timestamp: string;
    Price: number;
    Size: number;
    Exchange: string;
    Tape: string;
    Conditions?: string[];
  }[];
  symbol: string;
  next_page_token?: string;
}

// Respuesta de latest quote (v2/stocks/{symbol}/quotes/latest)
export interface AlpacaLatestQuoteResponse {
  quote: {
    Timestamp: string;
    AskPrice: number;
    AskSize: number;
    BidPrice: number;
    BidSize: number;
    Conditions?: string[];
  };
  symbol: string;
}

// Activo de Alpaca
export interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
}