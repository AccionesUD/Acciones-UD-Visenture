

// watchlist.model.ts
export interface Watchlist {
  id: string;
  name: string;
  stocks: WatchlistStock[];
  created: Date;
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  currentPrice: number;
}