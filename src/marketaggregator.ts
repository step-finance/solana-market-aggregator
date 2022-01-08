import {
  CoinGeckoMarketSource,
  SerumMarketSource,
  StakedStepMarketSource,
  StakedInvictusMarketSource,
  MarketSource,
} from "./sources";
import {
  ISerumMarketInfo,
  MarketDataMap,
  MarketSourcesData,
  TokenMap,
} from "./types";
import { getTokenMap } from "./utils/tokens";
import { getMintInfoMap } from "./utils/mints";
import { getSerumMarketInfoMap } from "./utils/serum";
import { getStarAtlasData } from "./utils/star-atlas";
import { Cluster, Connection, ConnectionConfig } from "@solana/web3.js";

export type MarketAggregatorConnectionConfig = ConnectionConfig & {
  endpoint: string;
  cluster: Cluster;
};

/**
 * A class that aggregates multiple market sources
 */
export class MarketAggregator {
  readonly connection: Connection;
  readonly cluster: Cluster;
  tokenMap: TokenMap = {};
  serumMarkets: ISerumMarketInfo[] = [];
  stakedSources: MarketSource[] = [];
  // Map of tokens without CoinGecko IDs
  private serumTokenMap: TokenMap = {};

  constructor(config: MarketAggregatorConnectionConfig) {
    const { endpoint, cluster, ...web3ConnectionConfig } = config;
    this.connection = new Connection(endpoint, web3ConnectionConfig);
    this.cluster = cluster;
    this.setupStakedSources();
  }

  /**
   * Updates the token and market lists
   *
   * @return Boolean indicating success state
   */
  public async queryLists(): Promise<boolean> {
    try {
      const tokenMap = await getTokenMap(this.connection, this.cluster);
      const { tokenMap: starAtlasTokenMap, markets: starAtlasSerumMarkets } =
        await getStarAtlasData(this.cluster);

      const serumMarketInfoMap = await getSerumMarketInfoMap();
      this.tokenMap = { ...starAtlasTokenMap, ...tokenMap };
      this.serumTokenMap = Object.values(this.tokenMap).reduce(
        (map, tokenInfo) => {
          if (!tokenInfo.extensions?.coingeckoId) {
            map[tokenInfo.address] = tokenInfo;
          }
          return map;
        },
        {}
      );
      this.serumMarkets = [...starAtlasSerumMarkets, ...serumMarketInfoMap];
    } catch (err) {
      console.log(err);
      return false;
    }

    return true;
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  public async querySources(): Promise<MarketSourcesData> {
    // Ensure lists have always been queried at least once
    if (
      Object.keys(this.tokenMap).length === 0 ||
      this.serumMarkets.length === 0
    ) {
      await this.queryLists();
    }

    const coingeckoMarketDataMap = await new CoinGeckoMarketSource().query(
      this.tokenMap
    );
    const serumSource = new SerumMarketSource(
      this.connection,
      this.serumTokenMap,
      this.serumMarkets
    );
    const serumMarketDataMap = await serumSource.query();

    let markets: MarketDataMap = {
      ...serumMarketDataMap,
      ...coingeckoMarketDataMap,
    };

    for (const source of this.stakedSources) {
      const sourceDataMap = await source.query(markets);
      markets = { ...markets, ...sourceDataMap };
    }

    const mintInfo = await getMintInfoMap(this.connection, this.tokenMap);

    return { markets, mintInfo };
  }

  /**
   * Instantiate staked sources
   *
   * A staked source expects a MarketDataMap parameter for `query` for price lookups
   */
  private setupStakedSources() {
    this.stakedSources.push(new StakedStepMarketSource(this.connection));
    this.stakedSources.push(new StakedInvictusMarketSource(this.connection));
  }
}
