import type { BN, Idl } from "@project-serum/anchor";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { ConfirmOptions, Connection } from "@solana/web3.js";

import XSTEP_IDL from "../models/idl/step_staking.json";
import type { MarketDataMap } from "../types/marketdata";
import type { MarketSource } from "./marketsource";

const XSTEP_PROGRAM_ID = "Stk5NCWomVN3itaFjLu382u9ibb5jMSHEsh6CuhaGjB";
export const STEP_MINT = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
export const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";
const XSTEP_TOKEN_VAULT = "ANYxxG365hutGYaTdtUQG8u2hC4dFX9mFHKuzy9ABQJi";
const STEP_DEPLOYER = "GkT2mRSujbydLUmA178ykHe7hZtaUpkmX2sfwS8suWb3";

type XStepPriceEvent = {
  stepPerXstepE9: BN;
  stepPerXstep: string;
};

/**
 * A class that retrieves market price of xSTEP
 */
export class StakedStepMarketSource implements MarketSource {
  readonly connection: Connection;
  readonly provider: AnchorProvider;
  readonly program: Program;

  /**
   * Create the class
   *
   * @param connection Web3 Connection
   */
  constructor(connection: Connection) {
    this.connection = connection;

    const CONFIRM_OPTIONS: ConfirmOptions = {
      preflightCommitment: "recent",
      commitment: "recent",
    };

    const wallet: Wallet = {
      signTransaction: Promise.resolve.bind(Promise),
      signAllTransactions: Promise.resolve.bind(Promise),
      publicKey: new web3.PublicKey(STEP_DEPLOYER),
    };

    this.provider = new AnchorProvider(this.connection, wallet, CONFIRM_OPTIONS);
    this.program = new Program(XSTEP_IDL as Idl, XSTEP_PROGRAM_ID, this.provider);
  }

  /**
   * Queries the latest xSTEP price
   *
   * @return Array containing one element which is xSTEP
   */
  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const xStepMarketData = marketDataMap[STEP_MINT];
    if (!xStepMarketData) {
      return {};
    }

    // Trial fix for intermittent BlockhashNotFound error.
    await this.connection.getRecentBlockhash("max");

    const res = await this.program.simulate.emitPrice!({
      accounts: {
        tokenMint: new web3.PublicKey(STEP_MINT),
        xTokenMint: new web3.PublicKey(XSTEP_MINT),
        tokenVault: new web3.PublicKey(XSTEP_TOKEN_VAULT),
      },
    });

    const priceEvent = res.events[0]?.data as XStepPriceEvent;
    return {
      [XSTEP_MINT]: {
        source: "contract",
        symbol: "xSTEP",
        address: XSTEP_MINT,
        price: Number(priceEvent.stepPerXstep) * xStepMarketData.price,
      },
    };
  }
}
