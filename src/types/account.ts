import {
  AccountInfo,
  PublicKey
} from "@solana/web3.js";
import {
  AccountInfo as TokenAccountInfo
} from "@solana/spl-token";
import { Buffer } from "buffer";

export interface TokenAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: TokenAccountInfo;
}

export interface ParsedAccountBase {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: any; // TODO: change to unkown
}

export type AccountParser = (
  // eslint-disable-next-line no-unused-vars
  pubkey: PublicKey,
  // eslint-disable-next-line no-unused-vars
  data: AccountInfo<Buffer>
) => ParsedAccountBase | undefined;

export interface ParsedAccount<T> extends ParsedAccountBase {
  info: T;
}
