import { expect } from "chai";
import { MarketAggregator } from "../src/marketaggregator";

const STEP_ADDRESS = "StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT";
const XSTEP_MINT = "xStpgUCss9piqeFUk2iLVcvJEGhAdJxJQuwLkXP555G";
const EXAMPLE_STEP_DEVNET_TOKEN = "7XWr8fagdZS4mrXUFexQrCd2nYxahR6AtuQkcF2AYecq";
const EXAMPLE_SABER_DEVNET_TOKEN = "CASHVDm2wsJXfhj6VWxb7GiMdoLc17Du7paH4bNr5woT";

// Saber
const AEMIM_ADDRESS = "2ASbApnFVSTp2RJvMLgLVfbDwJvu1FRXdhJWrGs89Lhj";
const SUSD8_ADDRESS = "88881Hu2jGMfCs9tMu5Rr7Ah7WBNBuXqde4nR5ZmKYYy";
const aeDAI = "9w6LpS7RU1DKftiwH3NgShtXbkMM1ke9iNU4g3MBXSUs";
const renLUNASaber = "KUANeD8EQvwpT1W7QZDtDqctLEh2FfSTy5pThE9CogT";

describe("Market Aggregator", () => {
  describe("#queryLists", () => {
    it("queries common currencies from token-list", async () => {
      const aggregator = new MarketAggregator({
        endpoint: process.env.MAINNET_ENDPOINT!,
        cluster: "mainnet-beta",
      });

      await aggregator.queryLists();
      expect(aggregator.tokenMap).to.haveOwnProperty(STEP_ADDRESS);
      // Spot check Saber tokens
      expect(aggregator.tokenMap).to.haveOwnProperty(AEMIM_ADDRESS);
      expect(aggregator.tokenMap).to.haveOwnProperty(SUSD8_ADDRESS);
      expect(aggregator.tokenMap).to.haveOwnProperty(aeDAI);

      const dai = aggregator.tokenMap[aeDAI];
      expect(dai?.extensions?.coingeckoId).to.eq("dai");

      const lunaSaber = aggregator.tokenMap[renLUNASaber];
      expect(lunaSaber?.extensions?.coingeckoId).to.eq("terra-luna");
    });

    it("queries mints from Step swap pool registry on devnet", async () => {
      const aggregator = new MarketAggregator({
        endpoint: process.env.DEVNET_ENDPOINT!,
        cluster: "devnet",
      });
      await aggregator.queryLists();
      expect(aggregator.tokenMap).to.haveOwnProperty(EXAMPLE_STEP_DEVNET_TOKEN);
    });

    it("queries mints from Saber token registry on devnet", async () => {
      const aggregator = new MarketAggregator({
        endpoint: process.env.DEVNET_ENDPOINT!,
        cluster: "devnet",
      });
      await aggregator.queryLists();
      expect(aggregator.tokenMap).to.haveOwnProperty(EXAMPLE_SABER_DEVNET_TOKEN);
    });
  });

  describe("#querySources", () => {
    it("queries common currencies and their prices", async () => {
      const aggregator = new MarketAggregator({
        endpoint: process.env.MAINNET_ENDPOINT!,
        cluster: "mainnet-beta",
      });

      const { markets, mintInfo } = await aggregator.querySources();
      expect(markets).not.to.be.empty;
      expect(markets).to.include.keys([STEP_ADDRESS, XSTEP_MINT]);
      expect(mintInfo).not.to.be.empty;
      expect(mintInfo).to.include.keys([STEP_ADDRESS, XSTEP_MINT]);
    });

    describe("on a devnet cluster", () => {
      it("loads prices for tokens in Step swap pool registry", async () => {
        const aggregator = new MarketAggregator({
          endpoint: process.env.DEVNET_ENDPOINT!,
          cluster: "devnet",
        });
        const { markets, mintInfo } = await aggregator.querySources();
        expect(markets).not.to.be.empty;
        expect(markets).to.include.keys([EXAMPLE_STEP_DEVNET_TOKEN]);
        expect(mintInfo).not.to.be.empty;
        expect(mintInfo).to.include.keys([EXAMPLE_STEP_DEVNET_TOKEN]);
      });
    });
  });
});
