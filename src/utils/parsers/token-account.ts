import { deserializeAccount } from "@saberhq/token-utils";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { TokenAccount } from "../../types";

export const TokenAccountParser = (pubKey: PublicKey, info: AccountInfo<Buffer>) => {
  const buffer = Buffer.from(info.data);
  const data = deserializeAccount(buffer);

  const details: TokenAccount = {
    pubkey: pubKey,
    account: {
      ...info,
    },
    info: { ...data, address: pubKey },
  };

  return details;
};
