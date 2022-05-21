import "mocha";

import { Connection } from "@solana/web3.js";
import { expect } from "chai";

import type { MarketDataMap } from "../src";
import { STAKED_TULIP_MINT, StakedTulipMarketSource, TULIP_MINT } from "../src/sources";

describe("Tulip Staking", () => {
  it("calculates price of sTULIP vs TULIP", async () => {
    const sTULIPStr = STAKED_TULIP_MINT.toBase58();
    const tulipMint = TULIP_MINT.toBase58();
    const staticTulipMarketData: MarketDataMap = {
      [tulipMint]: {
        address: tulipMint,
        price: 1,
        source: "coingecko",
        symbol: "TULIP",
      },
    };
    const mockTulipMarketData: MarketDataMap = {
      [tulipMint]: {
        address: tulipMint,
        price: 1000,
        source: "coingecko",
        symbol: "TULIP",
      },
    };

    const sTULIPSource = new StakedTulipMarketSource(new Connection(process.env.MAINNET_ENDPOINT!));
    const staticSTulipMarketData = (await sTULIPSource.query(staticTulipMarketData))[sTULIPStr];
    const sTULIPMarketData = (await sTULIPSource.query(mockTulipMarketData))[sTULIPStr];
    expect(staticSTulipMarketData!.price * mockTulipMarketData[tulipMint]!.price).to.equal(sTULIPMarketData!.price);
  });
});
