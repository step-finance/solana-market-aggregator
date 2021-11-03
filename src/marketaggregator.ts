import { Cluster, Connection, ConnectionConfig } from "@solana/web3.js";
import {
  CoinGeckoMarketSource,
  SerumMarketSource,
  StakedStepMarketSource,
  STEP_MINT,
} from "./sources";
import {
  MarketDataMap,
  MarketSourcesData,
  SerumMarketInfoMap,
  TokenMap,
} from "./types";
import { getTokenMap } from "./utils/tokens";
import { getMintInfoMap } from "./utils/mints";
import { getSerumMarketInfoMap } from "./utils/serum";
import { getStarAtlasData } from "./utils/star-atlas";

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
  serumMarketMap: SerumMarketInfoMap = {};
  xStep: StakedStepMarketSource;
  // Map of tokens without CoinGecko IDs
  private serumTokenMap: TokenMap = {};

  constructor(config: MarketAggregatorConnectionConfig) {
    const { endpoint, cluster, ...web3ConnectionConfig } = config;
    this.connection = new Connection(endpoint, web3ConnectionConfig);
    this.cluster = cluster;
    this.xStep = new StakedStepMarketSource(this.connection);
  }

  /**
   * Updates the token and market lists
   *
   * @return Boolean indicating success state
   */
  async queryLists(): Promise<boolean> {
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
      this.serumMarketMap = {
        ...starAtlasSerumMarkets,
        ...serumMarketInfoMap,
      };
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
  async querySources(): Promise<MarketSourcesData> {
    // Ensure lists have always been queried at least once
    if (
      Object.keys(this.tokenMap).length === 0 ||
      Object.keys(this.serumMarketMap).length === 0
    ) {
      await this.queryLists();
    }

    const coingeckoMarketDataMap = await new CoinGeckoMarketSource().query(
      this.tokenMap
    );
    const serumSource = new SerumMarketSource(
      this.connection,
      this.serumTokenMap,
      this.serumMarketMap
    );
    const serumMarketDataMap = await serumSource.query();

    let markets: MarketDataMap = {
      ...serumMarketDataMap,
      ...coingeckoMarketDataMap,
    };

    const stepMarketData = coingeckoMarketDataMap[STEP_MINT];
    if (stepMarketData) {
      const xStepDataMap = await this.xStep.query(stepMarketData.price);
      markets = { ...markets, ...xStepDataMap };
    }

    const mintInfo = await getMintInfoMap(this.connection, this.tokenMap);

    return { markets, mintInfo };
  }
}
