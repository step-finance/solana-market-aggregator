import axios from "axios";

import type {
  CoingeckoTokenMap,
  ICoinGeckoCoinMarketData,
  MarketDataMap,
  TokenInfoWithCoingeckoId,
  TokenMap,
} from "../types";
import { tokenInfoHasCoingeckoId } from "../types";
import { chunks } from "../utils/web3";
import type { MarketSource } from "./marketsource";

/**
 * A class that retrieves market prices from CoinGecko for a given set of tokens
 */
export class CoinGeckoMarketSource implements MarketSource {
  readonly API_BASE_URL: string = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async query(tokenMap: TokenMap): Promise<MarketDataMap> {
    const coingeckoTokenMap: CoingeckoTokenMap = {};
    const coingeckoIds: Set<string> = new Set();
    for (const baseTokenInfo of Object.values(tokenMap)) {
      if (tokenInfoHasCoingeckoId(baseTokenInfo)) {
        const tokenInfo: TokenInfoWithCoingeckoId = baseTokenInfo;
        const coingeckoId: string = tokenInfo.extensions.coingeckoId;
        coingeckoTokenMap[tokenInfo.address] = tokenInfo;
        coingeckoIds.add(coingeckoId);
      }
    }
    const pages = chunks(Array.from(coingeckoIds), 250);
    const chunkedResponses = await Promise.all(
      pages.map((p) => axios.get<ICoinGeckoCoinMarketData[]>(`${this.API_BASE_URL}&ids=${p.join(",")}&per_page=250`)),
    );
    const coingeckoPriceMap = chunkedResponses
      .flatMap((responses) => responses.data)
      .reduce<{ [coingeckoId: string]: number }>(
        (map, { id, current_price }) => ({
          ...map,
          [id]: current_price,
        }),
        {},
      );

    const marketDataMap: MarketDataMap = {};
    const cgMarkets = Object.values(coingeckoTokenMap);
    for (let index = 0; index < cgMarkets.length; index++) {
      const market = cgMarkets[index];
      if (!market) {
        continue;
      }

      const price = coingeckoPriceMap[market.extensions.coingeckoId];
      if (price) {
        marketDataMap[market.address] = {
          source: "coingecko",
          symbol: market.symbol,
          address: market.address,
          price,
        };
      }
    }

    return marketDataMap;
  }
}
