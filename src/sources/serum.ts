import { Connection, PublicKey } from "@solana/web3.js";
import type { TokenInfo } from "@solana/spl-token-registry";
import { Market, Orderbook } from "@project-serum/serum";

import type { MarketSource } from "./marketsource";
import type { MarketDataMap } from "../types/marketdata";
import type { ISerumMarketInfo, TokenMap } from "../types";
import { getMultipleAccounts } from "../utils/web3";
import { DexMarketParser } from "../utils/parsers";
import { AccountCache } from "../utils/cache";

export const SERUM_PROGRAM_ID_V3 =
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

export const USD_MINTS = new Set([
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
]);

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
  readonly accountCache: AccountCache;
  readonly tokenMap: TokenMap;
  readonly markets: ISerumMarketInfo[];
  private marketKeys: string[];

  /**
   * Create the class
   *
   * @param tokens List of tokens to find prices for
   * @param markets List of available markets to match tokens against
   */
  constructor(
    connection: Connection,
    accountCache: AccountCache,
    tokenMap: TokenMap,
    markets: ISerumMarketInfo[]
  ) {
    this.connection = connection;
    this.accountCache = accountCache;
    this.tokenMap = tokenMap;
    this.markets = markets;

    this.marketKeys = this.markets.reduce<string[]>(
      (keys, { address, baseMintAddress, deprecated }) => {
        if (!deprecated && this.tokenMap[baseMintAddress]) {
          keys.push(address);
        }
        return keys;
      },
      []
    );
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async query(): Promise<MarketDataMap> {
    const { keys, array } = await getMultipleAccounts(
      this.connection,
      // only query for markets that are not in cache
      this.marketKeys.filter((a) => this.accountCache.get(a) === undefined),
      "single"
    );

    for (let index = 0; index < array.length; index++) {
      const marketAddress = keys[index];
      const item = array[index];
      if (marketAddress && item) {
        this.accountCache.add(marketAddress, item, DexMarketParser);
      }
    }

    await this.updatePrices();

    const marketDataMap: MarketDataMap = {};
    for (let index = 0; index < this.markets.length; index++) {
      const market = this.markets[index];
      if (!market) {
        continue;
      }

      const { price, marketPrices, quoteMintAddress } = this.getMarketPrices(
        market.address
      );
      const tokenInfo = this.tokenMap[market.baseMintAddress];
      const isUSDQuote = USD_MINTS.has(quoteMintAddress);
      if (tokenInfo && isUSDQuote) {
        const { address, symbol } = tokenInfo;
        marketDataMap[address] = {
          source: "serum",
          symbol,
          address,
          price,
          metadata: {
            marketPrices,
          },
        };
      }
    }

    return marketDataMap;
  }

  private updatePrices = async () => {
    const accountsToQuery = new Set<string>();
    const mintsToQuery = new Set<string>();

    for (let index = 0; index < this.marketKeys.length; index++) {
      const m = this.marketKeys[index]!;
      const market = this.accountCache.get(m);
      if (!market) {
        return;
      }

      const decoded = market;

      if (!this.accountCache.getMint(decoded.info.baseMint)) {
        mintsToQuery.add(decoded.info.baseMint.toBase58());
      }

      if (!this.accountCache.getMint(decoded.info.quoteMint)) {
        mintsToQuery.add(decoded.info.quoteMint.toBase58());
      }

      accountsToQuery.add(decoded.info.bids.toBase58());
      accountsToQuery.add(decoded.info.asks.toBase58());
    }

    const allKeys = [...accountsToQuery.keys(), ...mintsToQuery.keys()];

    await getMultipleAccounts(this.connection, allKeys, "single").then(
      ({ keys, array }) => {
        return array
          .map((item, index) => {
            const address = keys[index];
            if (address && accountsToQuery.has(address)) {
              return this.accountCache.add(new PublicKey(address), item);
            } else if (address && mintsToQuery.has(address)) {
              return this.accountCache.addMint(new PublicKey(address), item);
            } else {
              return undefined;
            }
          })
          .filter((a) => !!a);
      }
    );
  };

  private getMarketPrices = (
    marketAddress: string
  ): {
    price: number;
    marketPrices: MarketPrices;
    quoteMintAddress: string;
  } => {
    let [bid, ask, mid] = [-1, -1, 0.0];

    const marketAccount = this.accountCache.get(marketAddress);
    if (!marketAccount) {
      return {
        quoteMintAddress: "",
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
      this.accountCache.getMint(decodedMarket.baseMint)?.decimals || 0;
    const quoteMintDecimals =
      this.accountCache.getMint(decodedMarket.quoteMint)?.decimals || 0;

    const market = new Market(
      decodedMarket,
      baseMintDecimals,
      quoteMintDecimals,
      undefined,
      decodedMarket.programId
    );

    const bids = this.accountCache.get(decodedMarket.bids)?.info;
    const asks = this.accountCache.get(decodedMarket.asks)?.info;

    let price = mid;
    if (bids) {
      const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
      const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

      const bestBid = bidsBook.getL2(1);
      const bestAsk = asksBook.getL2(1);

      if (bestBid[0]) {
        bid = bestBid[0][0];
        price = bid;
      }

      if (bestAsk[0]) {
        ask = bestAsk[0][0];
        price = ask;
      }

      if (bestBid.length > 0 && bestAsk.length > 0) {
        mid = (bid + ask) / 2.0;
        price = mid;
      }
    }

    return {
      quoteMintAddress: market.quoteMintAddress.toBase58(),
      price,
      marketPrices: {
        bid,
        ask,
        mid,
      },
    };
  };
}
