import type { TokenInfo } from "@solana/spl-token-registry";
import axios from "axios";

import { SERUM_PROGRAM_ID_V3 } from "../sources/serum";
import type { ISerumMarketInfo, StarAtlasNFT, TokenMap } from "../types";

export type StarAtlasData = {
  tokenMap: TokenMap;
  markets: ISerumMarketInfo[];
};

export const STAR_ATLAS_API_URL = "https://galaxy.staratlas.com/nfts" as const;

export const getStarAtlasData = async () => {
  try {
    const starAtlasApiResponse = await axios.get<StarAtlasNFT[]>(STAR_ATLAS_API_URL);
    const starAtlasTokenInfos: TokenInfo[] = starAtlasApiResponse.data.map(({ mint, symbol }) => ({
      chainId: 101,
      address: mint,
      name: symbol,
      decimals: 0,
      symbol: symbol,
      tags: ["nft"],
    }));

    const tokenMap = starAtlasTokenInfos.reduce<TokenMap>(
      (map, tokenInfo) => ({
        ...map,
        [tokenInfo.address]: tokenInfo,
      }),
      {},
    );

    const markets = starAtlasApiResponse.data.reduce<ISerumMarketInfo[]>((serumMarkets, { markets, symbol, mint }) => {
      const market = markets.find((m) => m.quotePair === "USDC");
      if (!market) {
        return serumMarkets;
      }
      const { id: address, quotePair, serumProgramId } = market;
      const name = `${symbol}/${quotePair}`;
      return [
        ...serumMarkets,
        {
          address,
          baseMintAddress: mint,
          deprecated: false,
          name,
          programId: serumProgramId ? serumProgramId : SERUM_PROGRAM_ID_V3,
        },
      ];
    }, []);

    return {
      tokenMap,
      markets,
    };
  } catch (err) {
    console.log(err);
    return {
      tokenMap: {},
      markets: [],
    };
  }
};
