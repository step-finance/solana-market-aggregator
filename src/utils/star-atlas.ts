import { Cluster } from "@solana/web3.js";
import { TokenListContainer } from "@solana/spl-token-registry";
import axios from "axios";
import { ISerumMarketInfo, StarAtlasNFT, TokenMap } from "../types";
import { SERUM_PROGRAM_ID_V3 } from "../sources/serum";

export type StarAtlasData = {
  tokenMap: TokenMap;
  markets: ISerumMarketInfo[];
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
      tags: ["nft"],
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

  const markets = starAtlasApiResponse.data.reduce<ISerumMarketInfo[]>(
    (serumMarkets, { markets, symbol, mint }) => {
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
    },
    []
  );

  return {
    tokenMap,
    markets,
  };
};
