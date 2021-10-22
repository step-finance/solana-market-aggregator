import { TokenMap } from "./tokens";
import { SerumMarketInfoMap } from "../types/serum";
import { SERUM_PROGRAM_ID_V3 } from "../sources/serum";
import axios from "axios";
import { StarAtlasNFT } from "../types/star-atlas";
import { Cluster } from "@solana/web3.js";
import { TokenListContainer } from "@solana/spl-token-registry";

export type StarAtlasData = {
  tokenMap: TokenMap;
  markets: SerumMarketInfoMap;
};

export const STAR_ATLAS_API_URL =
  "https://galaxy.production.run.staratlas.one/nfts" as const;

export const getStarAtlasData = async (cluster: Cluster) => {
  const starAtlasApiResponse = await axios.get<StarAtlasNFT[]>(
    STAR_ATLAS_API_URL
  );
  const starAtlasTokenListContainer = new TokenListContainer(
    starAtlasApiResponse.data.map(({ mint, symbol }) => ({
      chainId: 101,
      address: mint,
      name: symbol,
      decimals: 0,
      symbol: symbol,
    }))
  );
  const starAtlasTokenInfos = starAtlasTokenListContainer
    .filterByClusterSlug(cluster)
    .getList();
  const tokenMap = starAtlasTokenInfos.reduce<TokenMap>(
    (map, tokenInfo) => ({
      ...map,
      [tokenInfo.address]: tokenInfo,
    }),
    {}
  );

  const markets = starAtlasApiResponse.data.reduce<SerumMarketInfoMap>(
    (map, { markets, symbol }) => {
      const { id: address, quotePair, serumProgramId } = markets[0];
      const name = `${symbol}/${quotePair}`;
      return {
        ...map,
        [name]: {
          deprecated: false,
          address,
          name,
          programId: serumProgramId ? serumProgramId : SERUM_PROGRAM_ID_V3,
        },
      };
    },
    {}
  );

  return {
    tokenMap,
    markets,
  };
};
