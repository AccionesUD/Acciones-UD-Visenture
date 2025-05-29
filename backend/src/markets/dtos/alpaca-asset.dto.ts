export interface AlpacaAsset {
  symbol: string;
  name: string;
  status: string;
  exchange: string;
  class: string;
  currency: string;
  country?: string; // opcional, no siempre está
}
