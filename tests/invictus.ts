import { Connection } from "@solana/web3.js";
import { expect } from "chai";
import "mocha";

import {
  StakedInvictusMarketSource,
  STAKED_INVICTUS_MINT,
} from "../src/sources/invictus";

describe("Staked Invicuts source", () => {
  it("Loads price relative to Invictus", async () => {
    const staticInvicutsPrice = 1;
    const mockedInvictusPrice = 1000;

    const endpoint = "https://api.mainnet-beta.solana.com/";
    const InvictusSource = new StakedInvictusMarketSource(
      new Connection(endpoint)
    );
    const staticStakedInvictusData = (
      await InvictusSource.query(staticInvicutsPrice)
    )[STAKED_INVICTUS_MINT];
    const stakedInvictusMarketData = (
      await InvictusSource.query(mockedInvictusPrice)
    )[STAKED_INVICTUS_MINT];
    expect(staticStakedInvictusData.price * mockedInvictusPrice).to.equal(
      stakedInvictusMarketData.price
    );
  });
});
