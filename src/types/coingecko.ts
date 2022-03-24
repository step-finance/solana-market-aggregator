import type { TokenExtensions, TokenInfo } from "@solana/spl-token-registry";

export interface ICoinGeckoCoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

export type TokenInfoWithCoingeckoId = Omit<TokenInfo, "extensions"> & {
  extensions: Omit<TokenExtensions, "coingeckoId"> & {
    readonly coingeckoId: string;
  };
};
export const tokenInfoHasCoingeckoId = (
  tokenInfo: TokenInfo
): tokenInfo is TokenInfoWithCoingeckoId => !!tokenInfo.extensions?.coingeckoId;

export type CoingeckoTokenMap = { [address: string]: TokenInfoWithCoingeckoId };
