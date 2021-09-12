import { expect } from "chai";
import "mocha";

import { MarketAggregator } from "../src/marketaggregator";

describe("Market Aggregator", () => {
  describe("Can", () => {
    it("Aggregate", async () => {

      const endpoint = "https://api.mainnet-beta.solana.com/";

      const aggregator = new MarketAggregator(endpoint);
      await aggregator.queryLists();

      const markets = await aggregator.querySources();
      expect(markets.length).to.gt(0);
    });
  });
});
