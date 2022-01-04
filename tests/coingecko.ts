import { expect } from "chai";
import "mocha";

import { CoinGeckoMarketSource } from "../src/sources/coingecko";
import { MarketDataMap, TokenMap } from "../src/types";

const WRAPPED_SOL_ADDRESS = "So11111111111111111111111111111111111111112";
const UST_ADDRESS = "UST98bfV6EASdTFQrRwCBczpehdMFwYCUdLT5tEbhpW";

const TEST_TOKEN_MAP: TokenMap = {
  [WRAPPED_SOL_ADDRESS]: {
    chainId: 101,
    address: WRAPPED_SOL_ADDRESS,
    symbol: "WSOL",
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
  UST98bfV6EASdTFQrRwCBczpehdMFwYCUdLT5tEbhpW: {
    chainId: 101,
    address: "UST98bfV6EASdTFQrRwCBczpehdMFwYCUdLT5tEbhpW",
    symbol: "swtUST-9",
    name: "Saber Wrapped UST (Wormhole) (9 decimals)",
    decimals: 9,
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/UST98bfV6EASdTFQrRwCBczpehdMFwYCUdLT5tEbhpW/icon.png",
    tags: [
      "wrapped",
      "wormhole",
      "saber-mkt-usd",
      "wormhole-v2",
      "saber-dec-wrapped",
    ],
    extensions: {
      address: "uusd",
      bridgeContract:
        "https://finder.terra.money/columbus-5/address/terra10nmmwe8r3g99a9newtqa7a75xfgs2e8z87r2sf",
      coingeckoId: "terra-usd",
      website: "https://app.saber.so",
    },
  },
};

describe("CoinGecko Source", () => {
  let prices: MarketDataMap;

  before(async () => {
    prices = await new CoinGeckoMarketSource().query(TEST_TOKEN_MAP);
  });

  it("requests market prices for given tokens in token map", () => {
    expect(prices).to.include.keys([
      "So11111111111111111111111111111111111111112",
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
      "UST98bfV6EASdTFQrRwCBczpehdMFwYCUdLT5tEbhpW",
    ]);
  });

  it("properly sets market data values", () => {
    const wrappedSOLMarketData = prices[WRAPPED_SOL_ADDRESS]!;
    expect(wrappedSOLMarketData.source).to.equal("coingecko");
    expect(wrappedSOLMarketData.address).to.equal(WRAPPED_SOL_ADDRESS);
    expect(wrappedSOLMarketData.symbol).to.equal("WSOL");
    expect(wrappedSOLMarketData.price).to.be.a("number");
    expect(wrappedSOLMarketData.metadata).to.be.undefined;
  });

  it("Overrides TerraUSD coins with malformed CoinGecko ID", () => {
    const wrappedUSTMarketData = prices[UST_ADDRESS]!;
    expect(wrappedUSTMarketData.source).to.equal("coingecko");
    expect(wrappedUSTMarketData.address).to.equal(UST_ADDRESS);
    expect(wrappedUSTMarketData.symbol).to.equal("swtUST-9");
    expect(wrappedUSTMarketData.price).to.be.a("number");
    expect(wrappedUSTMarketData.metadata).to.be.undefined;
  });
});
