import { Connection } from "@solana/web3.js";
import { expect } from "chai";
import "mocha";

import {
  INVICTUS_MINT,
  LOCKED_STAKED_INVICTUS_MINT,
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
    const staticInvictusDataMap = await InvictusSource.query(
      staticInvictusMarketData
    );
    const staticStakedInvictusData =
      staticInvictusDataMap[STAKED_INVICTUS_MINT]!;
    const staticLockedStakedInvictusData =
      staticInvictusDataMap[LOCKED_STAKED_INVICTUS_MINT]!;

    const invictusDataMap = await InvictusSource.query(
      mockedInvictusMarketData
    );
    const stakedInvictusMarketData = invictusDataMap[STAKED_INVICTUS_MINT]!;
    const lockedStakedInvictusMarketData =
      invictusDataMap[LOCKED_STAKED_INVICTUS_MINT]!;
    expect(
      staticStakedInvictusData.price *
        mockedInvictusMarketData[INVICTUS_MINT]!.price
    ).to.equal(stakedInvictusMarketData.price);
    expect(
      staticLockedStakedInvictusData.price *
        mockedInvictusMarketData[INVICTUS_MINT]!.price
    ).to.equal(lockedStakedInvictusMarketData.price);
  });
});
