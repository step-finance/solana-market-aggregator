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

export type RawMintInfo = {
  mintAuthority: string | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
};

export type MintInfoMap = {
  [address: string]: RawMintInfo;
};

export type MarketSourcesData = {
  markets: MarketDataMap;
  mintInfo: MintInfoMap;
}
