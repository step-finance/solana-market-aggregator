import { Cluster, Connection, PublicKey } from "@solana/web3.js";
import {
  ENV,
  Strategy,
  TokenInfo,
  TokenListContainer,
  TokenListProvider,
} from "@solana/spl-token-registry";
import { deserializeMint } from "@saberhq/token-utils";
import {
  STEP_SWAP_OWNER,
  STEP_SWAP_PROGRAM_ID,
  TokenSwap as StepTokenSwap,
  TokenSwapLayout as StepSwapLayout,
} from "@stepfinance/step-swap";
import axios from "axios";
import { getMultipleAccounts, isAccountInfoBuffer } from "./web3";
import {
  TokenMap,
  TokenInfoWithCoingeckoId,
  tokenInfoHasCoingeckoId,
} from "../types";

// shorten the checksummed version of the input address to have 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const getTokenMap = async (
  connection: Connection,
  cluster: Cluster
): Promise<TokenMap> => {
  const baseTokenListProvider = new TokenListProvider();
  const baseTokenList = await baseTokenListProvider.resolve(Strategy.GitHub);
  const baseTokenInfos = baseTokenList
    .filterByClusterSlug(cluster)
    .excludeByTag("lp-token")
    .excludeByTag("tokenized-stock")
    .getList();

  const tokenMap: TokenMap = baseTokenInfos.reduce<TokenMap>(
    (map, tokenInfo) => {
      try {
        new PublicKey(tokenInfo.address);
        return { ...map, [tokenInfo.address]: tokenInfo };
      } catch (e) {
        return map;
      }
    },
    {}
  );

  const { data: rawStepTokenOverridesList } = await axios.get<TokenInfo[]>(
    "https://raw.githubusercontent.com/step-finance/token-list-overrides/main/src/token-list.json"
  );
  const stepTokenOverridesList = new TokenListContainer(
    rawStepTokenOverridesList
  );
  const stepTokenOverridesTokenInfos = stepTokenOverridesList
    .filterByClusterSlug(cluster)
    .getList();

  for (const tokenInfo of stepTokenOverridesTokenInfos) {
    const { address } = tokenInfo;
    try {
      new PublicKey(address);
      tokenMap[address] = tokenInfo;
    } catch (e) {
      console.error(e);
    }
  }

  const rawSaberTokenList = (
    await axios.get<{ tokens: TokenInfo[] }>(
      "https://registry.saber.so/data/token-list.mainnet.json"
    )
  ).data.tokens;
  const saberTokenList = new TokenListContainer(rawSaberTokenList);
  const saberTokenInfos = saberTokenList
    .filterByClusterSlug(cluster)
    .excludeByTag("saber-stableswap-lp")
    .excludeByTag("saber-hidden")
    .getList();

  for (const tokenInfo of saberTokenInfos) {
    const { address } = tokenInfo;
    try {
      new PublicKey(address);
      const ti = tokenMap[address];
      // Don't override if coingeckoId already exists
      if (ti && ti.extensions?.coingeckoId === undefined) {
        tokenMap[address] = tokenInfo;
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const tokenInfo of Object.values(tokenMap)) {
    const { address } = tokenInfo;
    tokenMap[address] = overrideCoingeckoId(tokenInfo);
  }

  if (cluster === "devnet") {
    const devnetStepAMMTokenInfos = await getDevnetStepAMMTokenInfos(
      connection,
      tokenMap
    );
    for (const tokenInfo of devnetStepAMMTokenInfos) {
      const { address } = tokenInfo;
      if (!tokenMap[address]) {
        tokenMap[address] = tokenInfo;
      }
    }
  }

  return tokenMap;
};

const overrideCoingeckoId = (tokenInfo: TokenInfo): TokenInfo => {
  let updatedTokenInfo: TokenInfoWithCoingeckoId | undefined;
  if (tokenInfoHasCoingeckoId(tokenInfo)) {
    switch (tokenInfo.extensions.coingeckoId) {
      case "multi-collateral-dai":
        updatedTokenInfo = {
          ...tokenInfo,
          extensions: {
            ...tokenInfo.extensions,
            coingeckoId: "dai",
          },
        };
        break;
      case "wrapped-bitcoin":
        updatedTokenInfo = {
          ...tokenInfo,
          extensions: {
            ...tokenInfo.extensions,
            coingeckoId: "bitcoin",
          },
        };
        break;
      case "terra-usd":
        updatedTokenInfo = {
          ...tokenInfo,
          extensions: {
            ...tokenInfo.extensions,
            coingeckoId: "terrausd",
          },
        };
        break;
      case "wrapped-terra":
        updatedTokenInfo = {
          ...tokenInfo,
          extensions: {
            ...tokenInfo.extensions,
            coingeckoId: "terra-luna",
          },
        };
        break;
    }
  } else {
    const tags = tokenInfo.tags ?? [];
    if (tags.includes("saber-mkt-luna")) {
      updatedTokenInfo = {
        ...tokenInfo,
        extensions: {
          ...tokenInfo.extensions,
          coingeckoId: "terra-luna",
        },
      };
    } else if (tags.includes("saber-mkt-sol")) {
      updatedTokenInfo = {
        ...tokenInfo,
        extensions: {
          ...tokenInfo.extensions,
          coingeckoId: "solana",
        },
      };
    }
  }

  return updatedTokenInfo ? updatedTokenInfo : tokenInfo;
};

const getDevnetStepAMMTokenInfos = async (
  connection: Connection,
  tokenMap: TokenMap
): Promise<TokenInfo[]> => {
  const poolRegistry = await StepTokenSwap.loadPoolRegistry(
    connection,
    STEP_SWAP_OWNER,
    STEP_SWAP_PROGRAM_ID
  );

  if (poolRegistry) {
    const poolAccountAddresses = poolRegistry.accounts
      .slice(0, poolRegistry.registrySize)
      .map((publicKey) => publicKey.toBase58());

    const { array } = await getMultipleAccounts(
      connection,
      poolAccountAddresses,
      "single"
    );
    const mintSet = new Set<string>();
    array.forEach((accountInfo) => {
      if (isAccountInfoBuffer(accountInfo)) {
        const poolRawData = StepSwapLayout.decode(accountInfo.data);
        const mintAString = new PublicKey(poolRawData.mintA).toBase58();
        const mintBString = new PublicKey(poolRawData.mintB).toBase58();
        if (!tokenMap[mintAString]) {
          mintSet.add(mintAString);
        }
        if (!tokenMap[mintBString]) {
          mintSet.add(mintBString);
        }
      }
    });

    const { keys, array: rawMintArray } = await getMultipleAccounts(
      connection,
      Array.from(mintSet),
      "confirmed"
    );

    return rawMintArray.reduce<TokenInfo[]>(
      (tokenInfoArray, rawMint, index) => {
        const address = keys[index];
        if (!address || !isAccountInfoBuffer(rawMint)) {
          return tokenInfoArray;
        }
        const { decimals } = deserializeMint(rawMint.data);
        return [
          ...tokenInfoArray,
          {
            address,
            chainId: ENV.Devnet,
            decimals,
            name: shortenAddress(address),
            symbol: shortenAddress(address),
            extensions: {
              // Default devnet tokens to stablecoin
              coingeckoId: "usd-coin",
            },
          },
        ];
      },
      []
    );
  }

  return [];
};
