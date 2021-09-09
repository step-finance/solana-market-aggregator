import { AccountInfo, PublicKey } from "@solana/web3.js";
import { Market, Orderbook } from "@project-serum/serum";
import { Buffer } from "buffer";
import { ParsedAccountBase } from "../types/account";
import { cache, MintParser } from "../utils/account";

export interface ISerumMarketInfo {
  address: string;
  name: string;
  programId: string;
  deprecated: boolean;
}

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

export const DEFAULT_DEX_ID = new PublicKey(
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
);

export const DexMarketParser = (
  pubkey: PublicKey,
  acc: AccountInfo<Buffer>
) => {
  const decoded = Market.getLayout(DEFAULT_DEX_ID).decode(
    acc.data
  );

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
