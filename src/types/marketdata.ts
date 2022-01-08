import { RawMintInfo } from "../utils";

export interface IMarketData {
  source: string;
  symbol: string;
  address: string;
  price: number;
  metadata?: Record<string, any>;
}

export type MarketDataMap = {
  [address: string]: IMarketData;
};

export type MintInfoMap = {
  [address: string]: RawMintInfo;
};

export type MarketSourcesData = {
  markets: MarketDataMap;
  mintInfo: MintInfoMap;
};
