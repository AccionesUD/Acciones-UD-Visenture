/**
 * Interfaz para noticias financieras de la API de Alpaca
 */
export interface AlpacaNews {
  ID: number;
  Headline: string;
  Author: string;
  CreatedAt: string;
  UpdatedAt: string;
  Summary: string;
  URL: string;
  Images: string[];
  Symbols: string[];
  Source: string;
}

/**
 * Parámetros para solicitar noticias a la API de Alpaca
 */
export interface GetNewsParams {
  symbols?: string[];
  start?: string;
  end?: string;
  limit?: number;
  sort?: 'ASC' | 'DESC';
}

/**
 * Fallback de noticias para cuando no hay conexión a la API
 */
export interface FinancialNews {
  title: string;
  source: string;
  url: string;
  date: string;
  summary: string;
  imageUrl?: string;
  symbols?: string[];
}
