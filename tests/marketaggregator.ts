import { expect } from "chai";
import { MarketAggregator } from "../src/marketaggregator";

const endpoint = "https://api.mainnet-beta.solana.com/";
const STEP_ADDRESS = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";

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

      const addresses = markets.map(({ address }) => address);
      expect(addresses).to.include(STEP_ADDRESS);
      expect(addresses).to.include(XSTEP_MINT);
    });
  });
});
