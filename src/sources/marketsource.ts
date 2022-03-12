import type { MarketDataMap } from "../types/marketdata";

export interface MarketSource {
  // eslint-disable-next-line no-unused-vars
  query(...args: any[]): Promise<MarketDataMap>;
}
