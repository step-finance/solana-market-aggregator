import { Connection } from "@solana/web3.js";
import { expect } from "chai";
import "mocha";

import { StakedStepMarketSource, XSTEP_MINT } from "../src/sources/xstep";

describe("xSTEP source", () => {
  it("Loads price relative to STEP", async () => {
    const staticStepPrice = 1;
    const mockedStepPrice = 1000;

    const xStepSource = new StakedStepMarketSource(
      new Connection(process.env.DEVNET_ENDPOINT!)
    );
    const staticXStepMarketData = (await xStepSource.query(staticStepPrice))[
      XSTEP_MINT
    ];
    const xStepMarketData = (await xStepSource.query(mockedStepPrice))[
      XSTEP_MINT
    ];
    expect(staticXStepMarketData.price * mockedStepPrice).to.equal(
      xStepMarketData.price
    );
  });
});
