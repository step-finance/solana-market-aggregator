import axios from "axios";
import {
  TokenMap,
  MarketDataMap,
  ICoinGeckoCoinMarketData,
  CoingeckoTokenMap,
  tokenInfoHasCoingeckoId,
} from "../types";
import { MarketSource } from "./marketsource";
import { chunks } from "../utils/web3";

/**
 * A class that retrieves market prices from CoinGecko for a given set of tokens
 */
export class CoinGeckoMarketSource implements MarketSource {
  readonly API_BASE_URL: string =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async query(tokenMap: TokenMap): Promise<MarketDataMap> {
    const coingeckoTokenMap: CoingeckoTokenMap = {};
    const coingeckoIds: Set<string> = new Set();
    for (let tokenInfo of Object.values(tokenMap)) {
      if (tokenInfoHasCoingeckoId(tokenInfo)) {
        coingeckoTokenMap[tokenInfo.address] = tokenInfo;
        coingeckoIds.add(tokenInfo.extensions.coingeckoId);
      }
    }
    const pages = chunks(Array.from(coingeckoIds), 250);
    const chunkedResponses = await Promise.all(
      pages.map((p) =>
        axios.get<ICoinGeckoCoinMarketData[]>(
          `${this.API_BASE_URL}&ids=${p.join(",")}&per_page=250`
        )
      )
    );
    const coingeckoPriceMap = chunkedResponses
      .flatMap((responses) => responses.data)
      .reduce<{ [coingeckoId: string]: number }>(
        (map, { id, current_price }) => ({
          ...map,
          [id]: current_price,
        }),
        {}
      );

    return Object.values(coingeckoTokenMap).reduce<MarketDataMap>(
      (map, { address, symbol, extensions }) => {
        const price = coingeckoPriceMap[extensions.coingeckoId];
        return {
          ...map,
          [address]: {
            source: "coingecko",
            symbol,
            address,
            price,
          },
        };
      },
      {}
    );
  }
}
