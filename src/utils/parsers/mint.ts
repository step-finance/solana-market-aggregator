import { deserializeMint } from "@saberhq/token-utils";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ParsedAccountBase } from "./types";

export const MintParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);

  const data = deserializeMint(buffer);

  const details: ParsedAccountBase = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: data,
  };

  return details;
};
