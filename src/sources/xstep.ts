import {
  Connection,
  ConnectionConfig as Web3ConnectionConfig,
  ConfirmOptions,
} from "@solana/web3.js";
import { BN, Idl, Program, Provider, web3 } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/src/provider";

import { MarketSource } from "./marketsource";
import { IMarketData } from "../types/marketdata";
import XSTEP_IDL from "../models/idl/step_staking.json";

const XSTEP_PROGRAM_ID = "Stk5NCWomVN3itaFjLu382u9ibb5jMSHEsh6CuhaGjB";
export const STEP_MINT = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";
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
  connection: Connection;
  provider: Provider;
  program: Program;

  /**
   * Create the class
   *
   * @param rpc_endpoint RPC endpoint
   * @param rpc_http_headers Optional HTTP headers for RPC connection
   */
  constructor(rpc_endpoint: string, rpc_http_headers?: any) {
    const web3Config: Web3ConnectionConfig = {
      commitment: "recent",
      httpHeaders: rpc_http_headers,
    };
    this.connection = new Connection(rpc_endpoint, web3Config);

    const CONFIRM_OPTIONS: ConfirmOptions = {
      preflightCommitment: "recent",
      commitment: "recent",
    };

    const wallet: Wallet = {
      signTransaction: Promise.resolve.bind(Promise),
      signAllTransactions: Promise.resolve.bind(Promise),
      publicKey: new web3.PublicKey(STEP_DEPLOYER),
    };

    this.provider = new Provider(this.connection, wallet, CONFIRM_OPTIONS);
    this.program = new Program(
      XSTEP_IDL as Idl,
      XSTEP_PROGRAM_ID,
      this.provider
    );
  }

  /**
   * Queries the latest xSTEP price
   *
   * @return Array containing one element which is xSTEP
   */
  async query(stepPrice: number): Promise<IMarketData[]> {
    const res = await this.program.simulate.emitPrice({
      accounts: {
        tokenMint: new web3.PublicKey(STEP_MINT),
        xTokenMint: new web3.PublicKey(XSTEP_MINT),
        tokenVault: new web3.PublicKey(XSTEP_TOKEN_VAULT),
      },
    });

    const priceEvent = res.events[0].data as XStepPriceEvent;
    return [
      {
        source: "contract",
        symbol: "xSTEP",
        address: XSTEP_MINT,
        price: Number(priceEvent.stepPerXstep) * stepPrice,
      },
    ];
  }
}
