import { Connection, PublicKey } from "@solana/web3.js";
import { TokenInfo } from "@solana/spl-token-registry";
import { Market, Orderbook } from "@project-serum/serum";

import { MarketSource } from "./marketsource";
import { IMarketData } from "../types/marketdata";
import { ISerumMarketInfo, DexMarketParser } from "../types/serum";
import { cache } from "../utils/account";
import { getMultipleAccounts } from "../utils/web3";

export const SERUM_PROGRAM_ID_V3 = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

export interface ISerumMarketTokenInfo {
  marketInfo: ISerumMarketInfo;
  tokenInfo: TokenInfo;
}

/**
 * A class that retrieves market prices from Serum DEX for a given set of tokens
 * and markets.
 */
export class SerumMarketSource implements MarketSource {
  tokens: TokenInfo[];
  markets: ISerumMarketInfo[];
  marketKeys: string[];
  marketByMint: Map<string, ISerumMarketTokenInfo>;
  connection: Connection;

  /**
   * Create the class
   *
   * @param tokens List of tokens to find prices for
   * @param markets List of available markets to match tokens against
   */
  constructor(tokens: TokenInfo[], markets: ISerumMarketInfo[]) {
    this.connection = new Connection("https://api.mainnet-beta.solana.com/");
    this.tokens = tokens;
    this.markets = markets;

    this.marketByMint = this.tokens.reduce((map, token) => {
      const marketInfo = this.markets
        .filter((m) => !m.deprecated)
        .find(
          (m) =>
            m.name === `${token.symbol}/USDC` ||
            m.name === `${token.symbol}/USDT`
        );

      if (marketInfo) {
        map.set(
          token.address,
          {
            marketInfo,
            tokenInfo: token
          }
        );
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
  async query(): Promise<IMarketData[]> {
    await getMultipleAccounts(
      this.connection,
      // only query for markets that are not in cache
      this.marketKeys.filter((a) => cache.get(a) === undefined),
      "single"
    ).then(({ keys, array }) => {
      return array.map((item, index) => {
        if (!item) {
          return undefined;
        }
        const marketAddress = keys[index];
        cache.add(marketAddress, item, DexMarketParser);
        return item;
      });
    });

    await this.updatePrices();

    const marketDatas: IMarketData[] = [];
    this.marketByMint.forEach((value, key) => {
      marketDatas.push({
        source: "serum",
        symbol: value.tokenInfo.symbol,
        address: key,
        price: this.getBidPrice(key),
      })
    });

    return marketDatas;
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
            if (!item) {
              return undefined;
            }
            const address = keys[index];
            if (accountsToQuery.has(address)) {
              return cache.add(new PublicKey(address), item);
            } else if (mintsToQuery.has(address)) {
              return cache.addMint(new PublicKey(address), item);
            }
          })
          .filter((a) => !!a);
      }
    );
  }

  private getBidPrice = (
    mintAddress: string
  ): number => {
    let [bid, ask, mid] = [-1, -1, 0.0];

    const marketTokenInfo = this.marketByMint.get(mintAddress)

    if (!marketTokenInfo) {
      return bid;
    }

    const marketAddress = marketTokenInfo.marketInfo.address;

    const marketAccount = cache.get(marketAddress);
    if (!marketAccount) {
      return bid;
    }

    const decodedMarket = marketAccount.info;

    const baseMintDecimals = cache.getMint(decodedMarket.baseMint)?.decimals || 0;
    const quoteMintDecimals = cache.getMint(decodedMarket.quoteMint)?.decimals || 0;

    const market = new Market(
      decodedMarket,
      baseMintDecimals,
      quoteMintDecimals,
      undefined,
      decodedMarket.programId
    );

    const bids = cache.get(decodedMarket.bids)?.info;
    const asks = cache.get(decodedMarket.asks)?.info;

    if (bids) {
      const bidsBook = new Orderbook(market, bids.accountFlags, bids.slab);
      const asksBook = new Orderbook(market, asks.accountFlags, asks.slab);

      const bestBid = bidsBook.getL2(1);
      const bestAsk = asksBook.getL2(1);

      if (bestBid.length > 0 && bestAsk.length > 0) {
        bid = bestBid[0][0];
        ask = bestAsk[0][0];
        mid = (bid + ask) / 2.0;
      } else if (bestBid.length > 0) {
        return bestBid[0][0];
      } else if (bestAsk.length > 0) {
        return bestAsk[0][0];
      }
    }

    return mid;
  }
}
