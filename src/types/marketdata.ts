export interface IMarketData {
  source: string;
  symbol: string;
  address: string;
  price: number;
  metadata?: Record<string, any>;
}
