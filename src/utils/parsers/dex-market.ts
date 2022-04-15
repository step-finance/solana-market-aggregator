import { Market } from "@project-serum/serum";
import type { AccountInfo } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { AccountCache } from "../cache";
import type { ParsedAccountBase } from ".";
import { MintParser } from "./mint";
import { OrderBookParser } from "./orderbook";

export const DEFAULT_DEX_ID = new PublicKey("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin");

export const DexMarketParser = (pubkey: PublicKey, acc: AccountInfo<Buffer>, accountCache?: AccountCache) => {
  const decoded = Market.getLayout(DEFAULT_DEX_ID).decode(acc.data);

  const details = {
    pubkey,
    account: {
      ...acc,
    },
    info: decoded,
  } as ParsedAccountBase;

  accountCache?.registerParser(details.info.baseMint, MintParser);
  accountCache?.registerParser(details.info.quoteMint, MintParser);
  accountCache?.registerParser(details.info.bids, OrderBookParser);
  accountCache?.registerParser(details.info.asks, OrderBookParser);

  return details;
};
