import axios from "axios";
import { TokenListProvider, TokenInfo, Strategy, ENV } from "@solana/spl-token-registry";
import {
  CoinGeckoMarketSource,
  SerumMarketSource,
  StakedStepMarketSource,
  SERUM_PROGRAM_ID_V3,
  STEP_MINT
} from "./sources";
import { ISerumMarketInfo } from "./types/serum";
import { IMarketData } from "./types/marketdata";

/**
 * A class that aggregates multiple market sources
 */
export class MarketAggregator {
  readonly SERUM_MARKET_LIST: string = "https://raw.githubusercontent.com/step-finance/serum-markets/main/src/markets.json";
  readonly STAR_ATLAS_API: string = "https://galaxy.production.run.staratlas.one/nfts";
  tokenInfos: TokenInfo[] = [];
  serumMarketInfos: ISerumMarketInfo[] = [];
  rpc_endpoint: string;
  rpc_http_headers: any;
  xStep: StakedStepMarketSource;

  constructor(rpc_endpoint: string, rpc_http_headers?: any) {
    this.rpc_endpoint = rpc_endpoint;
    this.rpc_http_headers = rpc_http_headers;
    this.xStep = new StakedStepMarketSource(this.rpc_endpoint, this.rpc_http_headers);
  }

  /**
   * Updates the token and market lists
   *
   * @return Boolean indicating success state
   */
  async queryLists(): Promise<boolean> {
    try {
      const tokenList = await this.queryTokenList();
      const starAtlasInfo = await this.queryStarAtlas();

      const smResponse = await axios.get(this.SERUM_MARKET_LIST);
      const serumMarketList = smResponse.data as ISerumMarketInfo[];

      this.tokenInfos = tokenList.concat(starAtlasInfo.tokens);
      this.serumMarketInfos = serumMarketList.concat(starAtlasInfo.markets);
    } catch (err) {
      console.log(err)
      return false;
    }

    return true;
  }

  /**
   * Queries the latest market data
   *
   * @return Array of market datas
   */
  async querySources(): Promise<IMarketData[]> {
    // Ensure lists have always been queried at least once
    if (this.tokenInfos.length === 0 || this.serumMarketInfos.length === 0) {
      await this.queryLists();
    }

    const cgms = new CoinGeckoMarketSource(this.tokenInfos);
    const cgPrices = await cgms.query();

    const tokensWithoutIDs = this.tokenInfos.filter((t) => !t.extensions?.coingeckoId);
    const serumSource = new SerumMarketSource(
      tokensWithoutIDs,
      this.serumMarketInfos,
      this.rpc_endpoint,
      this.rpc_http_headers
    );
    const serumPrices = await serumSource.query();

    let sources = cgPrices.concat(serumPrices);

    const stepMarketData = cgPrices.find(({ address }) => address === STEP_MINT);
    if (stepMarketData) {
      const xStepPrice = await this.xStep.query(stepMarketData.price);
      sources = sources.concat(xStepPrice);
    }

    return sources;
  }

  private async queryTokenList(): Promise<TokenInfo[]> {
    const tokenListProvider = new TokenListProvider();
    const tokenList = await tokenListProvider.resolve(Strategy.GitHub);
    return tokenList.filterByChainId(ENV.MainnetBeta)
      .excludeByTag("lp-token")
      .excludeByTag("tokenized-stock")
      .getList()
  }

  private async queryStarAtlas(): Promise<{ tokens: TokenInfo[], markets: ISerumMarketInfo[] }> {
    const saResponse = await axios.get(this.STAR_ATLAS_API);
    const starAtlasTokens = saResponse.data.map((nft: any) => {
      return {
        chainId: 101,
        address: nft.mint,
        name: nft.symbol,
        decimals: 0,
        symbol: nft.symbol
      };
    });

    const starAtlasMarkets = saResponse.data.map((nft: any) => {
      return {
        deprecated: false,
        address: nft.markets[0].id,
        name: `${nft.symbol}/${nft.markets[0].quotePair}`,
        programId: nft.markets[0].serumProgramId ?
          nft.markets[0].serumProgramId : SERUM_PROGRAM_ID_V3
      }
    });

    return {
      tokens: starAtlasTokens,
      markets: starAtlasMarkets
    };
  }
}
