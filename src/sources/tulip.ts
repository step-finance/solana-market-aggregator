import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { MarketDataMap } from "../types";
import type { MarketSource } from "./marketsource";

const TULIP_STAKING_VAULT_ID = new PublicKey("82aST5b1s1ZEB8dP7sDLjLYNRC85sGKmjmYtyeWVnyjz");
export const STAKED_TULIP_MINT = new PublicKey("STuLiPmUCUtG1hQcwdc9de9sjYhVsYoucCiWqbApbpM");
export const TULIP_MINT = new PublicKey("TuLipcqtGVXP9XR62wM8WWCm6a9vhLs7T1uoWBk6FDs");

export class StakedTulipMarketSource implements MarketSource {
  readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const tulipMarketData = marketDataMap[TULIP_MINT.toBase58()];
    if (!tulipMarketData) {
      return {};
    }

    const commitment = "confirmed";

    const depositedTulipBalance =
      (await this.connection.getTokenAccountBalance(TULIP_STAKING_VAULT_ID, commitment)).value.uiAmount ?? 0;
    const sTulipSupply = (await this.connection.getTokenSupply(STAKED_TULIP_MINT, commitment)).value.uiAmount ?? 1;
    const ratio = depositedTulipBalance / sTulipSupply;

    const sTulipPrice = tulipMarketData.price * ratio;

    return {
      [STAKED_TULIP_MINT.toBase58()]: {
        address: STAKED_TULIP_MINT.toBase58(),
        price: sTulipPrice,
        source: "contract",
        symbol: "sTULIP",
      },
    };
  }
}
