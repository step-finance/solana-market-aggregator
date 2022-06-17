import axios from "axios";

import type { ISerumMarketInfo } from "../types/serum";

export const SERUM_MARKET_LIST_URL =
  "https://raw.githubusercontent.com/step-finance/serum-markets/main/src/markets.json" as const;

export const getSerumMarketInfoMap = async (): Promise<ISerumMarketInfo[] | undefined> => {
  try {
    const serumMarketResponse = await axios.get<ISerumMarketInfo[]>(SERUM_MARKET_LIST_URL);
    const { data: serumMarketList } = serumMarketResponse;
    return serumMarketList;
  } catch(err) {
    console.log(err);
    return;
  }

};
