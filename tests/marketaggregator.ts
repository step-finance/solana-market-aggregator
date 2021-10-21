import { expect } from "chai";
import { MarketAggregator } from "../src/marketaggregator";

const endpoint = "https://api.mainnet-beta.solana.com/";
const STEP_ADDRESS = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";

describe("Market Aggregator", () => {
  describe("#queryLists", () => {
    it("queries common currencies from token-list", async () => {
      const aggregator = new MarketAggregator({
        endpoint,
        cluster: "mainnet-beta",
      });

      await aggregator.queryLists();
      expect(aggregator.tokenMap).to.haveOwnProperty(STEP_ADDRESS);
    });

    it("queries mints from Step swap pool registry on devnet", async () => {
      const devnetEndpoint = "https://api.devnet.solana.com/";
      const EXAMPLE_DEVNET_TOKEN =
        "7XWr8fagdZS4mrXUFexQrCd2nYxahR6AtuQkcF2AYecq";
      const aggregator = new MarketAggregator({
        endpoint: devnetEndpoint,
        cluster: "devnet",
      });
      await aggregator.queryLists();
      expect(aggregator.tokenMap).to.haveOwnProperty(EXAMPLE_DEVNET_TOKEN);
    });
  });

  describe("#querySources", () => {
    it("queries common currencies and their prices", async () => {
      const aggregator = new MarketAggregator({
        endpoint,
        cluster: "mainnet-beta",
      });

      const { markets, mintInfo } = await aggregator.querySources();
      expect(markets).not.to.be.empty;
      expect(markets).to.include.keys([STEP_ADDRESS, XSTEP_MINT]);
      expect(mintInfo).not.to.be.empty;
      expect(mintInfo).to.include.keys([STEP_ADDRESS, XSTEP_MINT]);
    });
  });
});
