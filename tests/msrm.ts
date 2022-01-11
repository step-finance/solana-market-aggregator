import { expect } from "chai";
import "mocha";
import { MarketDataMap } from "../src";

import { MSRMMarketSource, SRM_MINT, MSRM_MINT } from "../src/sources/msrm";

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
    const staticMSRMMarketData = (await msrmSource.query(staticSRMMarketData))[
      MSRM_MINT
    ];
    const msrmMarketData = (await msrmSource.query(mockedSRMMarketData))[
      MSRM_MINT
    ];
    expect(
      staticMSRMMarketData!.price * mockedSRMMarketData[SRM_MINT]!.price
    ).to.equal(msrmMarketData!.price);
  });
});
