import type { Cluster, ConnectionConfig } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";

import type { MarketSource } from "./sources";
import {
  CoinGeckoMarketSource,
  SerumMarketSource,
  StakedBasisMarketSource,
  StakedInvictusMarketSource,
  StakedStepMarketSource,
  StakedTulipMarketSource,
  StepOracleMarketSource,
} from "./sources";
import { MSRMMarketSource } from "./sources/msrm";
import type { ISerumMarketInfo, MarketDataMap, MarketSourcesData, TokenMap } from "./types";
import { AccountCache } from "./utils";
import { getMintInfoMap } from "./utils/mints";
import { getSerumMarketInfoMap } from "./utils/serum";
import { getStarAtlasData } from "./utils/star-atlas";
import { getTokenMap } from "./utils/tokens";

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
  private accountCache: AccountCache;

  constructor(config: MarketAggregatorConnectionConfig) {
    const { endpoint, cluster, ...web3ConnectionConfig } = config;
    this.connection = new Connection(endpoint, web3ConnectionConfig);
    this.accountCache = new AccountCache(this.connection);
    this.cluster = cluster;
    this.setupStakedSources();
  }

  /**
   * Updates the token and market lists
   *
   * @return Boolean indicating success state
   */
  async queryLists(): Promise<boolean> {
    const tokenMap = await getTokenMap(this.connection, this.cluster);
    const { tokenMap: starAtlasTokenMap, markets: starAtlasSerumMarkets } = await getStarAtlasData();
    const serumMarketInfoMap = await getSerumMarketInfoMap();

    this.tokenMap = { ...starAtlasTokenMap, ...tokenMap };

    const serumTokenMap: TokenMap = {};
    const tokenInfos = Object.values(this.tokenMap);
    for (const tokenInfo of tokenInfos) {
      if (!tokenInfo.extensions?.coingeckoId) {
        serumTokenMap[tokenInfo.address] = tokenInfo;
      }
    }
    this.serumTokenMap = serumTokenMap;
    this.serumMarkets = [...starAtlasSerumMarkets, ...serumMarketInfoMap];

    return true;
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async querySources(): Promise<MarketSourcesData> {
    // Ensure lists have always been queried at least once
    if (Object.keys(this.tokenMap).length === 0 || this.serumMarkets.length === 0) {
      await this.queryLists();
    }

    const coingeckoMarketDataMap = await new CoinGeckoMarketSource().query(this.tokenMap);
    const serumSource = new SerumMarketSource(
      this.connection,
      this.accountCache,
      this.serumTokenMap,
      this.serumMarkets,
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

    const mintInfo = await getMintInfoMap(this.connection, Object.keys(this.tokenMap));

    return { markets, mintInfo };
  }

  /**
   * Instantiate staked sources
   *
   * A staked source expects a MarketDataMap parameter for `query` for price lookups
   */
  private setupStakedSources() {
    this.stakedSources.push(new StakedStepMarketSource(this.connection));
    this.stakedSources.push(new StepOracleMarketSource(this.connection));
    this.stakedSources.push(new StakedInvictusMarketSource(this.connection));
    this.stakedSources.push(new MSRMMarketSource());
    if (this.cluster === "mainnet-beta") {
      this.stakedSources.push(new StakedTulipMarketSource(this.connection));
      this.stakedSources.push(new StakedBasisMarketSource(this.connection));
    }
  }
}
