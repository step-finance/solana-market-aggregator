import { Cluster } from "@solana/web3.js";
import { TokenInfo, TokenListContainer } from "@solana/spl-token-registry";
import { formatNetwork, Network } from "@saberhq/solana-contrib";
import axios from "axios";

export type SaberLiquidityNetwork = "mainnet-beta" | "devnet";
export const isSaberLiquidityNetwork = (
  network: Network
): network is SaberLiquidityNetwork =>
  network === "mainnet-beta" || network === "devnet";

export const getSaberTokenInfos = async (
  cluster: Cluster
): Promise<TokenInfo[]> => {
  if (isSaberLiquidityNetwork(cluster)) {
    const formattedNetwork = formatNetwork(cluster);
    const rawSaberTokenList = (
      await axios.get<{ tokens: TokenInfo[] }>(
        `https://registry.saber.so/data/token-list.${formattedNetwork}.json`
      )
    ).data.tokens;
    const saberTokenList = new TokenListContainer(rawSaberTokenList);
    return saberTokenList
      .filterByClusterSlug(cluster)
      .excludeByTag("saber-stableswap-lp")
      .excludeByTag("saber-hidden")
      .getList();
  }

  return [];
};
