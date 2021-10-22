import "mocha";
import { expect } from "chai";

import { SerumMarketSource } from "../src/sources/serum";
import { SerumMarketInfoMap } from "../src/types/serum";
import { Connection } from "@solana/web3.js";
import { TokenMap } from "../src/utils/tokens";

const testMarketInfoMap: SerumMarketInfoMap = {
  "SOL/USDC": {
    address: "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
    deprecated: false,
    name: "SOL/USDC",
    programId: "EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o",
  },
  "BTC/USDC": {
    address: "A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw",
    deprecated: false,
    name: "BTC/USDC",
    programId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  },
};

const testTokenMap: TokenMap = {
  So11111111111111111111111111111111111111112: {
    chainId: 101,
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: [],
    extensions: {
      website: "https://solana.com/",
      serumV3Usdc: "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
      serumV3Usdt: "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1",
      coingeckoId: "solana",
    },
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    chainId: 101,
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["stablecoin"],
    extensions: {
      website: "https://www.centre.io/",
      coingeckoId: "usd-coin",
      serumV3Usdt: "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS",
    },
  },
  "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E": {
    chainId: 101,
    address: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    symbol: "BTC",
    name: "Wrapped Bitcoin (Sollet)",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png",
    tags: ["wrapped-sollet", "ethereum"],
    extensions: {
      bridgeContract:
        "https://etherscan.io/address/0xeae57ce9cc1984f202e15e038b964bb8bdf7229a",
      serumV3Usdc: "A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw",
      serumV3Usdt: "C1EuT9VokAKLiW7i2ASnZUvxDoKuKkCpDDeNxAptuNe4",
      coingeckoId: "bitcoin",
    },
  },
};
const endpoint = "https://api.mainnet-beta.solana.com/";
const connection = new Connection(endpoint);

describe("Serum Source", () => {
  it("requests market prices", async () => {
    const serumMarketSource = new SerumMarketSource(
      connection,
      testTokenMap,
      testMarketInfoMap
    );
    const marketDataMap = await serumMarketSource.query();
    expect(marketDataMap).to.include.keys([
      "So11111111111111111111111111111111111111112",
      "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    ]);
  });

  it("loads market prices data", async () => {
    const serumMarketSource = new SerumMarketSource(
      connection,
      testTokenMap,
      testMarketInfoMap
    );
    const serumSources = await serumMarketSource.query();
    const serumSource =
      serumSources["So11111111111111111111111111111111111111112"];
    expect(serumSource.metadata).to.exist;
    expect(serumSource.metadata!.marketPrices).to.have.all.keys(
      "bid",
      "ask",
      "mid"
    );
  });
});
