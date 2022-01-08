import { Market } from "@project-serum/serum";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { ParsedAccountBase } from ".";
import { cache } from "../cache";
import { MintParser } from "./mint";
import { OrderBookParser } from "./orderbook";

export const DEFAULT_DEX_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
);

export const DexMarketParser = (
  pubkey: PublicKey,
  acc: AccountInfo<Buffer>
) => {
  const decoded = Market.getLayout(DEFAULT_DEX_ID).decode(acc.data);

  const details = {
    pubkey,
    account: {
      ...acc,
    },
    info: decoded,
  } as ParsedAccountBase;

  cache.registerParser(details.info.baseMint, MintParser);
  cache.registerParser(details.info.quoteMint, MintParser);
  cache.registerParser(details.info.bids, OrderBookParser);
  cache.registerParser(details.info.asks, OrderBookParser);

  return details;
};
