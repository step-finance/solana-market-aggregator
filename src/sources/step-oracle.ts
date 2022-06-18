import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import SwitchboardProgram from "@switchboard-xyz/sbv2-lite";

import type { MarketDataMap } from "../types/marketdata";
import type { MarketSource } from "./marketsource";
import { STEP_MINT } from "./xstep";

const STEP_ORACLE_FEED_ID = new PublicKey("CdvmFaR2m3cL2YuDg9cSb2m3nKZX26vyVoBbB8aNMWaj");

/**
 * A class that retrieves oracle price of STEP
 */
export class StepOracleMarketSource implements MarketSource {
  readonly connection: Connection;
  sbv2: SwitchboardProgram | null;

  /**
   * Create the class
   *
   * @param connection Web3 Connection
   */
  constructor(connection: Connection) {
    this.connection = connection;
    this.sbv2 = null;
  }

  /**
   * Queries the STEP price from Switchboard
   *
   * @return Array containing one element which is STEP
   */
  async query(): Promise<MarketDataMap> {
    if (!this.sbv2) {
      this.sbv2 = await SwitchboardProgram.loadMainnet();
    }
    const accountInfo = await this.connection.getAccountInfo(STEP_ORACLE_FEED_ID);
    if (!accountInfo) {
      return {};
    }

    const latestResult = this.sbv2.decodeLatestAggregatorValue(accountInfo, 600);
    if (latestResult === null) {
      return {};
    }

    return {
      [STEP_MINT]: {
        source: "contract",
        symbol: "STEP",
        address: STEP_MINT,
        price: Number(latestResult),
      },
    };
  }
}
