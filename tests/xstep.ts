import { expect } from "chai";
import "mocha";

import { StakedStepMarketSource } from "../src/sources/xstep";

describe("xSTEP source", () => {
  it("Loads price relative to STEP", async () => {
    const staticStepPrice = 1;
    const mockedStepPrice = 1000;

    const endpoint = "https://api.devnet.solana.com/";
    const xStepSource = new StakedStepMarketSource(endpoint);
    const [staticXStepMarketData] = await xStepSource.query(staticStepPrice);
    const [xStepMarketData] = await xStepSource.query(mockedStepPrice);
    expect(staticXStepMarketData.price * mockedStepPrice).to.equal(
      xStepMarketData.price
    );
  });
});
