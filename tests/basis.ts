import "mocha";

import { expect } from "chai";

import { MarketAggregator } from "../src";
import { R_BASIS_MINT } from "../src/sources";

describe("Basis Market Staking", () => {
  it("calculates price of rBASIS vs BASIS", async () => {
    const aggregator = new MarketAggregator({
      cluster: "mainnet-beta",
      endpoint: process.env.MAINNET_ENDPOINT!,
    });

    // eslint-disable-next-line no-debugger
    debugger;

    const rBasisMintStr: string = R_BASIS_MINT.toBase58();

    const { markets } = await aggregator.querySources();
    expect(markets).to.not.be.empty;
    expect(markets).to.contain.keys([rBasisMintStr]);
    expect(markets[rBasisMintStr]?.price).above(0); // If there is an error then the price would be 0
  });
});