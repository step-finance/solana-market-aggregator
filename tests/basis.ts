import "mocha";

import { Connection } from "@solana/web3.js";
import { expect } from "chai";

import type { MarketDataMap } from "../dist";
import { StakedBasisMarketSource } from "../src/sources";

describe("Basis Market Staking", () => {
  it("Provides market data for rBASIS token", async () => {
    const marketSource = new StakedBasisMarketSource(new Connection(process.env.MAINNET_ENDPOINT as string));
    const marketDataMap = {
      ["Basis9oJw9j8cw53oMV7iqsgo6ihi9ALw4QR31rcjUJa"]: {
        address: "Basis9oJw9j8cw53oMV7iqsgo6ihi9ALw4QR31rcjUJa",
        price: 20,
        source: "coingecko",
        symbol: "BASIS",
      },
    };
    const marketData: MarketDataMap = await marketSource.query(marketDataMap);
    const { address, price, source, symbol } = marketData["rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM"] || {};

    expect(address).to.equal("rBsH9ME52axhqSjAVXY3t1xcCrmntVNvP3X16pRjVdM");
    expect(price).to.be.greaterThan(20);
    expect(source).to.equal("contract");
    expect(symbol).to.equal("rBASIS");
  });
});
