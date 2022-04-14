import "mocha";

import { Connection } from "@solana/web3.js";
import { expect } from "chai";

import type { MarketDataMap } from "../src";
import { StakedStepMarketSource, STEP_MINT, XSTEP_MINT } from "../src/sources/xstep";

describe("xSTEP source", () => {
  it("Loads price relative to STEP", async () => {
    const staticStepMarketData: MarketDataMap = {
      [STEP_MINT]: {
        address: STEP_MINT,
        source: "coingecko",
        symbol: "STEP",
        price: 1,
      },
    };
    const mockedStepMarketData: MarketDataMap = {
      [STEP_MINT]: {
        address: STEP_MINT,
        source: "coingecko",
        symbol: "STEP",
        price: 1000,
      },
    };

    const xStepSource = new StakedStepMarketSource(new Connection(process.env.DEVNET_ENDPOINT!));
    const staticXStepMarketData = (await xStepSource.query(staticStepMarketData))[XSTEP_MINT];
    const xStepMarketData = (await xStepSource.query(mockedStepMarketData))[XSTEP_MINT];
    expect(staticXStepMarketData!.price * mockedStepMarketData[STEP_MINT]!.price).to.equal(xStepMarketData!.price);
  });
});
