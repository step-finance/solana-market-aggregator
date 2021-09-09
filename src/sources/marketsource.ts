import { IMarketData } from "../types/marketdata";

export interface MarketSource {
    query(): Promise<IMarketData[]>;
}
