import type { AccountInfo, ConfirmedSignatureInfo, ConfirmedTransaction, PublicKey } from "@solana/web3.js";

import type { AccountCache } from "../cache";

export interface ParsedAccountBase {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: any; // TODO: change to unknown
}

export interface ParsedLocalTransaction {
  transactionType: number;
  signature: ConfirmedSignatureInfo;
  confirmedTx: ConfirmedTransaction | null;
}

export interface ParsedAccount<T> extends ParsedAccountBase {
  info: T;
}

export type AccountParser = (
  // eslint-disable-next-line no-unused-vars
  pubkey: PublicKey,
  // eslint-disable-next-line no-unused-vars
  data: AccountInfo<Buffer>,
  // eslint-disable-next-line no-unused-vars
  accountCache?: AccountCache,
) => ParsedAccountBase | undefined;
