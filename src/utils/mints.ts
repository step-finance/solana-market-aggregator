import { Connection } from "@solana/web3.js";
import { deserializeMint } from "@saberhq/token-utils";
import { MintInfoMap } from "../types";
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
  return array.reduce<MintInfoMap>((map, tokenAccount, index) => {
    const address = keys[index];
    if (!address || !isAccountInfoBuffer(tokenAccount)) {
      return map;
    }

    try {
      const {
        decimals,
        freezeAuthority,
        isInitialized,
        mintAuthority,
        supply,
      } = deserializeMint(tokenAccount.data);
      return {
        ...map,
        [address]: {
          mintAuthority: mintAuthority?.toBase58() ?? null,
          supply: supply.toString(),
          decimals,
          isInitialized,
          freezeAuthority: freezeAuthority?.toBase58() ?? null,
        },
      };
    } catch (e) {
      // Skip mints we cannot parse
      if ((e as Error).message === "Not a valid Mint") {
        return map;
      }
      throw e;
    }
  }, {});
};
