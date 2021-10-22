import axios from "axios";
import { ICoinGeckoCoinMarketData } from "../types/coingecko";
import { MarketSource } from "./marketsource";
import { MarketDataMap } from "../types/marketdata";
import { chunks } from "../utils/web3";
import { TokenMap } from "../utils/tokens";

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
    const addressCoingeckoIdMap: { [address: string]: string } = {};
    for (let { address, extensions } of Object.values(tokenMap)) {
      if (extensions?.coingeckoId) {
        addressCoingeckoIdMap[address] = extensions.coingeckoId;
      }
    }
    const pages = chunks(Object.values(addressCoingeckoIdMap), 250);
    const chunkedResponses = await Promise.all(
      pages.map((p) =>
        axios.get<ICoinGeckoCoinMarketData[]>(
          `${this.API_BASE_URL}&ids=${p.join(",")}&per_page=250`
        )
      )
    );
    const coingeckoPriceMap = chunkedResponses
      .flatMap((responses) => responses.data)
      .reduce(
        (map, { id, current_price }) => ({
          ...map,
          [id]: current_price,
        }),
        {}
      );

    return Object.keys(addressCoingeckoIdMap).reduce<MarketDataMap>(
      (map, address) => {
        const price = coingeckoPriceMap[address];
        const { symbol } = tokenMap[address];
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
