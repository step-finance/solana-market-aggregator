import { Connection } from "@solana/web3.js";
import { expect } from "chai";
import "mocha";

import {
  INVICTUS_MINT,
  StakedInvictusMarketSource,
  STAKED_INVICTUS_MINT,
} from "../src/sources/invictus";
import { MarketDataMap } from "../src/types";

describe("Staked Invictus source", () => {
  it("Loads price relative to Invictus", async () => {
    const staticInvictusMarketData: MarketDataMap = {
      [INVICTUS_MINT]: {
        address: INVICTUS_MINT,
        source: "coingecko",
        symbol: "IN",
        price: 1,
      },
    };
    const mockedInvictusMarketData: MarketDataMap = {
      [INVICTUS_MINT]: {
        address: INVICTUS_MINT,
        source: "coingecko",
        symbol: "IN",
        price: 1000,
      },
    };

    const InvictusSource = new StakedInvictusMarketSource(
      new Connection(process.env.MAINNET_ENDPOINT!)
    );
    const staticStakedInvictusData = (
      await InvictusSource.query(staticInvictusMarketData)
    )[STAKED_INVICTUS_MINT]!;
    const stakedInvictusMarketData = (
      await InvictusSource.query(mockedInvictusMarketData)
    )[STAKED_INVICTUS_MINT]!;
    expect(
      staticStakedInvictusData.price *
        mockedInvictusMarketData[INVICTUS_MINT]!.price
    ).to.equal(stakedInvictusMarketData.price);
  });
});
