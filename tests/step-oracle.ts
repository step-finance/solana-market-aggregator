import "mocha";

import { Connection } from "@solana/web3.js";
import { expect } from "chai";

import type { MarketDataMap } from "../dist";
import { StepOracleMarketSource } from "../src/sources";

describe("Step Oracle Price", () => {
  it("Provides market data for STEP token from oracle", async () => {
    const marketSource = new StepOracleMarketSource(new Connection(process.env.MAINNET_ENDPOINT as string));
    const marketData: MarketDataMap = await marketSource.query();
    const { address, price, source, symbol } = marketData["StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT"] || {};

    expect(address).to.equal("StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT");
    expect(price).to.be.greaterThan(0.01);
    expect(price).to.be.lessThan(10);
    expect(source).to.equal("switchboard");
    expect(symbol).to.equal("STEP");
  });
});
