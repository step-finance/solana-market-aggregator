import { Connection, PublicKey } from "@solana/web3.js";
import { TokenInfo } from "@solana/spl-token-registry";
import { Market, Orderbook } from "@project-serum/serum";

import { MarketSource } from "./marketsource";
import { MarketDataMap } from "../types/marketdata";
import {
  ISerumMarketInfo,
  DexMarketParser,
  SerumMarketInfoMap,
} from "../types/serum";
import { cache } from "../utils/account";
import { getMultipleAccounts } from "../utils/web3";
import { TokenMap } from "../utils/tokens";

export const SERUM_PROGRAM_ID_V3 =
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

export type MarketPrices = {
  bid: number;
  ask: number;
  mid: number;
};

export interface ISerumMarketTokenInfo {
  marketInfo: ISerumMarketInfo;
  tokenInfo: TokenInfo;
}

/**
 * A class that retrieves market prices from Serum DEX for a given set of tokens
 * and markets.
 */
export class SerumMarketSource implements MarketSource {
  readonly connection: Connection;
  readonly tokenMap: TokenMap;
  readonly marketInfoMap: SerumMarketInfoMap;
  private marketKeys: string[];
  private marketByMint: Map<string, ISerumMarketTokenInfo>;

  /**
   * Create the class
   *
   * @param tokens List of tokens to find prices for
   * @param markets List of available markets to match tokens against
   */
  constructor(
    connection: Connection,
    tokenMap: TokenMap,
    marketInfoMap: SerumMarketInfoMap
  ) {
    this.connection = connection;
    this.tokenMap = tokenMap;
    this.marketInfoMap = marketInfoMap;

    this.marketByMint = Object.values(this.tokenMap).reduce((map, token) => {
      const marketInfo =
        marketInfoMap[`${token.symbol}/USDC`] ??
        marketInfoMap[`${token.symbol}/USDT`];
      if (marketInfo && !marketInfo.deprecated) {
        map.set(token.address, {
          marketInfo,
          tokenInfo: token,
        });
      }

      return map;
    }, new Map<string, ISerumMarketTokenInfo>());

    this.marketKeys = [...this.marketByMint.values()].map((m) => {
      return m.marketInfo.address;
    });
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async query(): Promise<MarketDataMap> {
    await getMultipleAccounts(
      this.connection,
      // only query for markets that are not in cache
      this.marketKeys.filter((a) => cache.get(a) === undefined),
      "single"
    ).then(({ keys, array }) => {
      return array.map((item, index) => {
        const marketAddress = keys[index];
        cache.add(marketAddress, item, DexMarketParser);
        return item;
      });
    });

    await this.updatePrices();

    const marketDataMap: MarketDataMap = {};
    this.marketByMint.forEach((value, address) => {
      const { price, marketPrices } = this.getMarketPrices(address);
      marketDataMap[address] = {
        source: "serum",
        symbol: value.tokenInfo.symbol,
        address,
        price,
        metadata: {
          marketPrices,
        },
      };
    });

    return marketDataMap;
  }

  private updatePrices = async () => {
    const accountsToQuery = new Set<string>();
    const mintsToQuery = new Set<string>();
    this.marketKeys.forEach((m) => {
      const market = cache.get(m);
      if (!market) {
        return;
      }

      const decoded = market;

      if (!cache.getMint(decoded.info.baseMint)) {
        mintsToQuery.add(decoded.info.baseMint.toBase58());
      }

      if (!cache.getMint(decoded.info.quoteMint)) {
        mintsToQuery.add(decoded.info.quoteMint.toBase58());
      }

      accountsToQuery.add(decoded.info.bids.toBase58());
      accountsToQuery.add(decoded.info.asks.toBase58());
    });

    const allKeys = [...accountsToQuery.keys(), ...mintsToQuery.keys()];

    await getMultipleAccounts(this.connection, allKeys, "single").then(
      ({ keys, array }) => {
        return array
          .map((item, index) => {
            const address = keys[index];
            if (accountsToQuery.has(address)) {
              return cache.add(new PublicKey(address), item);
            } else if (mintsToQuery.has(address)) {
              return cache.addMint(new PublicKey(address), item);
            } else {
              return undefined;
            }
          })
          .filter((a) => !!a);
      }
    );
  };

  private getMarketPrices = (
    mintAddress: string
  ): {
    price: number;
    marketPrices: MarketPrices;
  } => {
    let [bid, ask, mid] = [-1, -1, 0.0];

    const marketTokenInfo = this.marketByMint.get(mintAddress);

    if (!marketTokenInfo) {
      return {
        price: bid,
        marketPrices: {
          bid,
          ask,
          mid,
        },
      };
    }

    const marketAddress = marketTokenInfo.marketInfo.address;

    const marketAccount = cache.get(marketAddress);
    if (!marketAccount) {
      return {
        price: bid,
        marketPrices: {
          bid,
          ask,
          mid,
        },
      };
    }

    const decodedMarket = marketAccount.info;

    const baseMintDecimals =
      cache.getMint(decodedMarket.baseMint)?.decimals || 0;
    const quoteMintDecimals =
      cache.getMint(decodedMarket.quoteMint)?.decimals || 0;

    const market = new Market(
      decodedMarket,
      baseMintDecimals,
      quoteMintDecimals,
      undefined,
      decodedMarket.programId
    );

    const bids = cache.get(decodedMarket.bids)?.info;
    const asks = cache.get(decodedMarket.asks)?.info;

    let price = mid;
    if (bids) {
      const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
      const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

      const bestBid = bidsBook.getL2(1);
      const bestAsk = asksBook.getL2(1);

      if (bestBid.length > 0) {
        bid = bestBid[0][0];
        price = bid;
      }

      if (bestAsk.length > 0) {
        ask = bestAsk[0][0];
        price = ask;
      }

      if (bestBid.length > 0 && bestAsk.length > 0) {
        mid = (bid + ask) / 2.0;
        price = mid;
      }
    }

    return {
      price,
      marketPrices: {
        bid,
        ask,
        mid,
      },
    };
  };
}
