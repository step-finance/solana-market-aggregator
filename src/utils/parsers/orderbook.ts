import { Orderbook } from "@project-serum/serum";
import type { AccountInfo, PublicKey } from "@solana/web3.js";

import type { ParsedAccountBase } from ".";

export const OrderBookParser = (id: PublicKey, acc: AccountInfo<Buffer>) => {
  const decoded = Orderbook.LAYOUT.decode(acc.data);

  const details = {
    pubkey: id,
    account: {
      ...acc,
    },
    info: decoded,
  } as ParsedAccountBase;

  return details;
};
