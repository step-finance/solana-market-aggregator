import "mocha";

import { expect } from "chai";

import { MarketAggregator } from "../src";
import { STAKED_TULIP_MINT } from "../src/sources";

describe("Tulip Staking", () => {
  it("calculates price of sTULIP vs TULIP", async () => {
    const aggregator = new MarketAggregator({
      cluster: "mainnet-beta",
      endpoint: process.env.MAINNET_ENDPOINT!,
    });

    const sTulipMintStr = STAKED_TULIP_MINT.toBase58();

    const { markets } = await aggregator.querySources();
    expect(markets).to.not.be.empty;
    expect(markets).to.contain.keys([sTulipMintStr]);
    expect(markets[sTulipMintStr]?.price).above(0); // If there is an error then the price would be 0
  });
});
