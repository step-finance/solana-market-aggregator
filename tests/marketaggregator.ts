import { expect } from "chai";
import { MarketAggregator } from "../src/marketaggregator";

const endpoint = "https://api.mainnet-beta.solana.com/";
const STEP_ADDRESS = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";

describe("Market Aggregator", () => {
  describe("#queryLists", () => {
    it("queries common currencies from token-list", async () => {
      const aggregator = new MarketAggregator(endpoint);

      await aggregator.queryLists();
      expect(aggregator.tokenInfos.map(({ address }) => address)).to.include(
        STEP_ADDRESS
      );
    });
  });

  describe("#querySources", () => {
    it("queries common currencies and their prices", async () => {
      const aggregator = new MarketAggregator(endpoint);

      const markets = await aggregator.querySources();
      expect(markets.length).to.gt(0);
      expect(markets.map(({ address }) => address)).to.include(STEP_ADDRESS);
    });
  });
});
