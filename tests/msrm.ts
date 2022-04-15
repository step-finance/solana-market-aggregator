import "mocha";

import { expect } from "chai";

import type { MarketDataMap } from "../src";
import { MSRM_MINT, MSRMMarketSource, SRM_MINT } from "../src/sources/msrm";

describe("MSRM source", () => {
  it("Loads price relative to SRM", async () => {
    const staticSRMMarketData: MarketDataMap = {
      [SRM_MINT]: {
        address: SRM_MINT,
        source: "coingecko",
        symbol: "SRM",
        price: 1,
      },
    };
    const mockedSRMMarketData: MarketDataMap = {
      [SRM_MINT]: {
        address: SRM_MINT,
        source: "coingecko",
        symbol: "SRM",
        price: 1000,
      },
    };

    const msrmSource = new MSRMMarketSource();
    const staticMSRMMarketData = (await msrmSource.query(staticSRMMarketData))[MSRM_MINT];
    const msrmMarketData = (await msrmSource.query(mockedSRMMarketData))[MSRM_MINT];
    expect(staticMSRMMarketData!.price * mockedSRMMarketData[SRM_MINT]!.price).to.equal(msrmMarketData!.price);
  });
});
