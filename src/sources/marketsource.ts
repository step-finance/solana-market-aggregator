import { IMarketData } from "../types/marketdata";

export interface MarketSource {
  // eslint-disable-next-line no-unused-vars
  query(...args: any[]): Promise<IMarketData[]>;
}
