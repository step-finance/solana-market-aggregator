import type { MarketDataMap } from "../types/marketdata";
import type { MarketSource } from "./marketsource";

export const SRM_MINT = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
export const MSRM_MINT = "MSRMcoVyrFxnSgo5uXwone5SKcGhT1KEJMFEkMEWf9L";
const MSRM_VALUE = 1000000;

/**
 * A class that retrieves market price of MSRM (MegaSerum)
 */
export class MSRMMarketSource implements MarketSource {
  /**
   * Queries the latest MSRM price
   *
   * @return Array containing one element which is MSRM
   */
  /* eslint-disable @typescript-eslint/require-await */
  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const srmMarketData = marketDataMap[SRM_MINT];
    if (!srmMarketData) {
      return {};
    }

    return {
      [MSRM_MINT]: {
        source: "contract",
        symbol: "MSRM",
        address: MSRM_MINT,
        price: MSRM_VALUE * srmMarketData.price,
      },
    };
  }
}
