import { Connection } from "@solana/web3.js";

import { MarketSource } from "./marketsource";
import type { MarketDataMap } from "../types/marketdata";
import { cache } from "../utils/cache";
import { TokenAccountParser } from "../utils/parsers";

export const INVICTUS_MINT = "inL8PMVd6iiW3RCBJnr5AsrRN6nqr4BTrcNuQWQSkvY";
export const STAKED_INVICTUS_MINT =
  "sinjBMHhAuvywW3o87uXHswuRXb3c7TfqgAdocedtDj";
const STAKED_INVICTUS_VAULT = "5EZiwr4fE1rbxpzQUWQ6N9ppkEridNwbH3dU3xUf7wPZ";
/**
 * A class that retrieves market price of sIN
 */
export class StakedInvictusMarketSource implements MarketSource {
  readonly connection: Connection;

  /**
   * Create the class
   *
   * @param connection Web3 Connection
   */
  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Queries the latest sIN price
   *
   * @return Array containing one element which is sIN
   */
  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const invictusMarketData = marketDataMap[INVICTUS_MINT];
    if (!invictusMarketData) {
      return {};
    }

    const stakedVault = await cache.query(
      this.connection,
      STAKED_INVICTUS_VAULT,
      TokenAccountParser
    );
    const stakedInvictusMint = await cache.queryMint(
      this.connection,
      STAKED_INVICTUS_MINT
    );
    const totalInvictusStaked = stakedVault.info.amount;
    const invictusRatio =
      totalInvictusStaked / stakedInvictusMint.supply.toNumber();

    const stakedInvictusPrice = invictusMarketData.price * invictusRatio;

    return {
      [STAKED_INVICTUS_MINT]: {
        source: "contract",
        symbol: "sIN",
        address: STAKED_INVICTUS_MINT,
        price: stakedInvictusPrice,
      },
    };
  }
}
