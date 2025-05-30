export interface MarketDto {
  symbol: string;
  name: string;
  isActive: boolean;
  country?: string;
  currency: string;
  status: string;
  price?: number; // precio actual de la acción
}
