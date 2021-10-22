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
  STEP_SWAP_PROGRAM_ID,
  TokenSwap as StepTokenSwap,
  TokenSwapLayout as StepSwapLayout,
} from "@stepfinance/step-swap";
import axios from "axios";
import { getMultipleAccounts } from "./web3";

// TODO: Update @stepfinance/step-swap to export this
export const STEP_SWAP_OWNER = new PublicKey(
  "GkT2mRSujbydLUmA178ykHe7hZtaUpkmX2sfwS8suWb3"
);

// shorten the checksummed version of the input address to have 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export type TokenMap = {
  [address: string]: TokenInfo;
};

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
    (map, tokenInfo) => ({ ...map, [tokenInfo.address]: tokenInfo }),
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
    tokenMap[address] = tokenInfo;
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
      // TODO: Update @stepfinance/step-swap with types for layout
      const poolRawData = StepSwapLayout.decode(accountInfo.data);
      const mintAString = new PublicKey(poolRawData.mintA).toBase58();
      const mintBString = new PublicKey(poolRawData.mintB).toBase58();
      if (!tokenMap[mintAString]) {
        mintSet.add(mintAString);
      }
      if (!tokenMap[mintBString]) {
        mintSet.add(mintBString);
      }
    });

    const { keys, array: rawMintArray } = await getMultipleAccounts(
      connection,
      Array.from(mintSet),
      "confirmed"
    );

    return rawMintArray.map((rawMint, index) => {
      const address = keys[index];
      const { decimals } = deserializeMint(rawMint.data);
      return {
        address,
        chainId: ENV.Devnet,
        decimals,
        name: shortenAddress(address),
        symbol: shortenAddress(address),
        extensions: {
          // Default devnet tokens to stablecoin
          coingeckoId: "usd-coin",
        },
      };
    });
  }

  return [];
};
