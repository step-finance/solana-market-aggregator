import { Connection } from "@solana/web3.js";
import { deserializeMint } from "@saberhq/token-utils";
import type { MintInfoMap } from "../types";
import { getMultipleAccounts, isAccountInfoBuffer } from "./web3";

export type RawMintInfo = {
  mintAuthority: string | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
};

export const getMintInfoMap = async (
  connection: Connection,
  tokenAddresses: string[]
): Promise<MintInfoMap> => {
  const { keys, array } = await getMultipleAccounts(
    connection,
    tokenAddresses,
    "confirmed"
  );

  const mintInfoMap: MintInfoMap = {};

  for (let index = 0; index < array.length; index++) {
    const address = keys[index];
    const tokenAccount = array[index];
    if (!address || !tokenAccount || !isAccountInfoBuffer(tokenAccount)) {
      continue;
    }

    try {
      const {
        decimals,
        freezeAuthority,
        isInitialized,
        mintAuthority,
        supply,
      } = deserializeMint(tokenAccount.data);

      mintInfoMap[address] = {
        mintAuthority: mintAuthority?.toBase58() ?? null,
        supply: supply.toString(),
        decimals,
        isInitialized,
        freezeAuthority: freezeAuthority?.toBase58() ?? null,
      };
    } catch (e) {
      // Ignore mints we cannot parse
      if ((e as Error).message !== "Not a valid Mint") {
        console.log(e);
      }
    }
  }

  return mintInfoMap;
};
