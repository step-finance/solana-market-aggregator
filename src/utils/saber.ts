import type { Cluster } from "@solana/web3.js";
import type { TokenInfo } from "@solana/spl-token-registry";
import { CLUSTER_SLUGS } from "@solana/spl-token-registry";
import type { Network } from "@saberhq/solana-contrib";
import { formatNetwork } from "@saberhq/solana-contrib";
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

    return rawSaberTokenList.filter(
      (t) =>
        t.chainId === CLUSTER_SLUGS[cluster] &&
        !t.tags?.includes("saber-stableswap-lp") &&
        !t.tags?.includes("saber-hidden")
    );
  }

  return [];
};
