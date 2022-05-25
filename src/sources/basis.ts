import type { Connection, RpcResponseAndContext, TokenAmount } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { MarketDataMap } from "../types";
import type { MarketSource } from "./marketsource";

export const R_BASIS_MINT = new PublicKey("rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM");
export const BASIS_MINT = new PublicKey("3sBX8hj4URsiBCSRV26fEHkake295fQnM44EYKKsSs51");

export class StakedBasisMarketSource implements MarketSource {
  readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const rBasisSupply = await this.connection
      .getTokenSupply(R_BASIS_MINT)
      .then((response: RpcResponseAndContext<TokenAmount>) => {
        return response.value.uiAmount;
      })
      .catch(() => {
        console.error(`Unexpected failure to getTokenAccountBalance for ${R_BASIS_MINT.toBase58()}`);
        return 0;
      });

    const basisSupply = await this.connection
      .getTokenAccountBalance(BASIS_MINT)
      .then((response: RpcResponseAndContext<TokenAmount>) => {
        return response.value.uiAmount;
      })
      .catch(() => {
        console.error(`Unexpected failure to getTokenSupply for ${BASIS_MINT.toBase58()}`);
        return 0;
      });

    // BASIS to rBASIS ratio
    let ratio = 0;
    if (rBasisSupply && basisSupply) {
      ratio = basisSupply / rBasisSupply;
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
