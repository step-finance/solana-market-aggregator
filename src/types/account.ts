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
  pubkey: PublicKey,
  data: AccountInfo<Buffer>
) => ParsedAccountBase | undefined;

export interface ParsedAccount<T> extends ParsedAccountBase {
  info: T;
}
