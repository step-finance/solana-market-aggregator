import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { MarketDataMap } from "../types";
import type { MarketSource } from "./marketsource";

export const R_BASIS_MINT = new PublicKey("rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM");
export const BASIS_MINT = new PublicKey("Basis9oJw9j8cw53oMV7iqsgo6ihi9ALw4QR31rcjUJa");
// This ATA holds all staked BASIS tokens in which the user is given
// a proportional amount of rBASIS to match their staked position
export const BASIS_TOKEN_VAULT = new PublicKey("3sBX8hj4URsiBCSRV26fEHkake295fQnM44EYKKsSs51");

export class StakedBasisMarketSource implements MarketSource {
  readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const rBasisSupply = (await this.connection.getTokenSupply(R_BASIS_MINT))?.value.uiAmount ?? 0;
    const basisSupplyInTokenVault =
      (await this.connection.getTokenAccountBalance(BASIS_TOKEN_VAULT))?.value.uiAmount ?? 0;

    // BASIS to rBASIS ratio
    let ratio = 0;
    if (rBasisSupply && basisSupplyInTokenVault) {
      ratio = basisSupplyInTokenVault / rBasisSupply;
    }

    const basisMarketData = marketDataMap[BASIS_MINT.toBase58()];
    if (!basisMarketData) {
      return {};
    }

    const rBasisPrice = basisMarketData.price * ratio;

    return {
      [R_BASIS_MINT.toBase58()]: {
        address: R_BASIS_MINT.toBase58(),
        price: rBasisPrice,
        source: "contract",
        symbol: "rBASIS",
      },
    };
  }
}
