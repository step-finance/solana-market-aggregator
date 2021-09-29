import axios from "axios";
import { TokenInfo } from "@solana/spl-token-registry";
import { ICoinGeckoCoinMarketData } from "../types/coingecko";
import { MarketSource } from "./marketsource";
import { IMarketData } from "../types/marketdata";
import { chunks } from "../utils/web3";

/**
 * A class that retrieves market prices from CoinGecko for a given set of tokens
 */
export class CoinGeckoMarketSource implements MarketSource {
  readonly API_BASE_URL: string =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";
  apiIDs: string[];
  tokens: TokenInfo[];

  /**
   * Create the class
   *
   * @param tokens List of tokens to find prices for
   */
  constructor(tokens: TokenInfo[]) {
    this.tokens = tokens;
    const tokensWithIDs = this.tokens.filter((t) => t.extensions?.coingeckoId);
    this.apiIDs = tokensWithIDs.map((t) => t.extensions?.coingeckoId) as [];
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async query(): Promise<IMarketData[]> {
    const pages = chunks(this.apiIDs, 250);
    const responses = await Promise.all(
      pages.map(async (p) =>
        axios.get(`${this.API_BASE_URL}&ids=${p.join(",")}&per_page=250`)
      )
    );

    const data: ICoinGeckoCoinMarketData[] = responses
      .map((r) => r.data)
      .flat();

    const finalList = this.tokens.map((token) => {
      const coinGeckoInfo = data.find((cgItem) => token.extensions?.coingeckoId === cgItem.id);

      if (!coinGeckoInfo) {
        return undefined;
      }

      return {
        source: "coingecko",
        symbol: token.symbol,
        address: token.address,
        price: coinGeckoInfo.current_price,
      };
    }).filter((x) => !!x) as IMarketData[];

    return finalList;
  }
}
