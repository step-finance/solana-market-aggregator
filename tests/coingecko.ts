import { expect } from "chai";
import "mocha";

import { CoinGeckoMarketSource } from "../src/sources/coingecko";

describe("CoinGecko Source", () => {
  describe("Can", () => {
    it("Request market prices", async () => {

      const testTokens = [
        {
          "chainId": 101,
          "address": "So11111111111111111111111111111111111111112",
          "symbol": "SOL",
          "name": "Wrapped SOL",
          "decimals": 9,
          "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          "tags": [],
          "extensions": {
            "website": "https://solana.com/",
            "serumV3Usdc": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
            "serumV3Usdt": "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1",
            "coingeckoId": "solana"
          }
        },
        {
          "chainId": 101,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "symbol": "USDC",
          "name": "USD Coin",
          "decimals": 6,
          "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
          "tags": [
            "stablecoin"
          ],
          "extensions": {
            "website": "https://www.centre.io/",
            "coingeckoId": "usd-coin",
            "serumV3Usdt": "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS"
          }
        },
        {
          "chainId": 101,
          "address": "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
          "symbol": "BTC",
          "name": "Wrapped Bitcoin (Sollet)",
          "decimals": 6,
          "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png",
          "tags": [
            "wrapped-sollet",
            "ethereum"
          ],
          "extensions": {
            "bridgeContract": "https://etherscan.io/address/0xeae57ce9cc1984f202e15e038b964bb8bdf7229a",
            "serumV3Usdc": "A8YFbxQYFVqKZaoYJLLUVcQiWP7G2MeEgW5wsAQgMvFw",
            "serumV3Usdt": "C1EuT9VokAKLiW7i2ASnZUvxDoKuKkCpDDeNxAptuNe4",
            "coingeckoId": "bitcoin"
          }
        },
      ];

      const cgms = new CoinGeckoMarketSource(testTokens);
      const prices = await cgms.query();
      expect(prices.length).to.equal(3);
    });
  });
});
