import { AccountInfo, ConfirmedSignatureInfo, ConfirmedTransaction, PublicKey } from "@solana/web3.js";

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

// eslint-disable-next-line no-unused-vars
export type AccountParser = (pubkey: PublicKey, data: AccountInfo<Buffer>) => ParsedAccountBase | undefined;
