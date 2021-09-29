import {
  Connection,
  ConnectionConfig as Web3ConnectionConfig,
  ConfirmOptions
} from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

import { MarketSource } from "./marketsource";
import { IMarketData } from "../types/marketdata";
import XSTEP_IDL from "../models/idl/step_staking.json";

const XSTEP_PROGRAM_ID = "Stk5NCWomVN3itaFjLu382u9ibb5jMSHEsh6CuhaGjB";
const STEP_MINT = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";
const XSTEP_TOKEN_VAULT = "ANYxxG365hutGYaTdtUQG8u2hC4dFX9mFHKuzy9ABQJi";
const STEP_DEPLOYER = "GkT2mRSujbydLUmA178ykHe7hZtaUpkmX2sfwS8suWb3";

/**
 * A class that retrieves market price of xSTEP
 */
export class StakedStepMarketSource implements MarketSource {
  connection: Connection;
  program: anchor.Program;

  /**
   * Create the class
   *
   * @param rpc_endpoint RPC endpoint
   * @param rpc_http_headers Optional HTTP headers for RPC connection
   */
  constructor(rpc_endpoint: string, rpc_http_headers?: any) {
    const web3Config: Web3ConnectionConfig = {
      commitment: "recent",
      httpHeaders: rpc_http_headers
    };
    this.connection = new Connection(rpc_endpoint, web3Config);

    const CONFIRM_OPTIONS: ConfirmOptions = {
      preflightCommitment: "recent",
      commitment: "recent",
    };

    const wallet = {
      signTransaction: a=>a,
      signAllTransactions: a=>a,
      publicKey: new anchor.web3.PublicKey(STEP_DEPLOYER),
    };

    anchor.setProvider(
      new anchor.Provider(this.connection, wallet, CONFIRM_OPTIONS)
    );
    this.program = new anchor.Program(
      XSTEP_IDL as anchor.Idl,
      XSTEP_PROGRAM_ID
    );
  }

  /**
   * Queries the latest xSTEP price
   *
   * @return Array containing one element which is xSTEP
   */
  async query(): Promise<IMarketData[]> {
    const res = await this.program.simulate.emitPrice(
      {
        accounts: {
          tokenMint: new anchor.web3.PublicKey(STEP_MINT),
          xTokenMint: new anchor.web3.PublicKey(XSTEP_MINT),
          tokenVault: new anchor.web3.PublicKey(XSTEP_TOKEN_VAULT),
        }
      }
    );

    const price = res.events[0].data as any;
    return [{
      source: "contract",
      symbol: "xSTEP",
      address: XSTEP_MINT,
      price: price.stepPerXstep,
    }];
  }
}
