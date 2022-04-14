import { deserializeMint } from "@saberhq/token-utils";
import type { MintInfo } from "@solana/spl-token";
import { u64 } from "@solana/spl-token";
import type { AccountInfo, Connection, ParsedAccountData } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { MintInfoMap } from "../../types";
import { BaseError } from "../errors";
import type { AccountParser, ParsedAccountBase, TokenAccount } from "../parsers";
import { isAccountInfoBuffer } from "../web3";
import { EventEmitter } from "./emitter";

// Arbitrary mint to represent SOL (not wrapped SOL).
const SOL_MINT = new PublicKey("Ejmc1UB4EsES5oAaRN63SpoxMJidt3ZGBrqrZk49vjTZ");

const getMintInfo = async (connection: Connection, pubKey: PublicKey): Promise<MintInfo> => {
  if (pubKey.equals(SOL_MINT)) {
    return {
      mintAuthority: null,
      supply: new u64(0),
      decimals: 9,
      isInitialized: true,
      freezeAuthority: null,
    };
  }

  const info = await connection.getAccountInfo(pubKey);
  if (info === null) {
    throw new Error("Failed to find mint account");
  }

  const data = Buffer.from(info.data);

  return deserializeMint(data);
};

export class AccountNotFoundError extends BaseError {}

// eslint-disable-next-line no-unused-vars
type AccountPredicate = (account: TokenAccount) => boolean;

export class AccountCache {
  private pendingMintCalls = new Map<string, Promise<MintInfo>>();
  private pendingCalls = new Map<string, Promise<ParsedAccountBase>>();
  private genericCache = new Map<string, ParsedAccountBase>();
  private mintCache = new Map<string, MintInfo>();
  private keyToAccountParser = new Map<string, AccountParser>();
  private emitter: EventEmitter;
  private connection: Connection;

  constructor(connection: Connection) {
    this.emitter = new EventEmitter();
    this.connection = connection;
  }

  async query(pubKey: string | PublicKey, parser?: AccountParser) {
    let id: PublicKey;
    if (typeof pubKey === "string") {
      id = new PublicKey(pubKey);
    } else {
      id = pubKey;
    }

    const address = id.toBase58();

    const account = this.genericCache.get(address);
    if (account) {
      return account;
    }

    let query = this.pendingCalls.get(address);
    if (query) {
      return query;
    }

    query = this.connection.getAccountInfo(id).then((data) => {
      if (!data) {
        throw new AccountNotFoundError(`Account not found with address ID ${id.toBase58()}`);
      }
      return this.add(id, data, parser);
    }) as Promise<TokenAccount>;
    this.pendingCalls.set(address, query as any);

    return query;
  }

  add(id: PublicKey | string, obj: AccountInfo<Buffer | ParsedAccountData>, parser?: AccountParser) {
    if (!isAccountInfoBuffer(obj) || obj.data.length === 0) {
      return;
    }

    const address = typeof id === "string" ? id : id?.toBase58();
    const deserialize = parser ? parser : this.keyToAccountParser.get(address);
    if (!deserialize) {
      throw new Error("Deserializer needs to be registered or passed as a parameter");
    }

    this.registerParser(id, deserialize);
    this.pendingCalls.delete(address);
    const account = deserialize(new PublicKey(address), obj, this);
    if (!account) {
      return;
    }

    const isNew = !this.genericCache.has(address);
    this.genericCache.set(address, account);
    this.emitter.raiseCacheUpdated(address, isNew, deserialize);
    return account;
  }

  has(pubKey: string | PublicKey): boolean {
    const key = pubKey instanceof PublicKey ? pubKey.toBase58() : pubKey;
    return this.genericCache.has(key);
  }

  get(pubKey: string | PublicKey) {
    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    return this.genericCache.get(key);
  }

  getAll() {
    return this.genericCache;
  }

  delete(pubKey: string | PublicKey) {
    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    if (this.genericCache.get(key)) {
      this.genericCache.delete(key);
      this.emitter.raiseCacheDeleted(key);
      return true;
    }
    return false;
  }

  byParser(parser: AccountParser) {
    const result: string[] = [];
    for (const id of this.keyToAccountParser.keys()) {
      if (this.keyToAccountParser.get(id) === parser) {
        result.push(id);
      }
    }

    return result;
  }

  registerParser(pubkey: PublicKey | string, parser: AccountParser) {
    if (pubkey) {
      const address = typeof pubkey === "string" ? pubkey : pubkey?.toBase58();
      this.keyToAccountParser.set(address, parser);
    }

    return pubkey;
  }

  async queryMint(pubKey: string | PublicKey) {
    let id: PublicKey;
    if (typeof pubKey === "string") {
      id = new PublicKey(pubKey);
    } else {
      id = pubKey;
    }

    const address = id.toBase58();
    const mint = this.mintCache.get(address);
    if (mint) {
      return mint;
    }

    let query = this.pendingMintCalls.get(address);
    if (query) {
      return query;
    }

    query = getMintInfo(this.connection, id).then((data) => {
      this.pendingMintCalls.delete(address);

      this.mintCache.set(address, data);
      return data;
    });
    this.pendingMintCalls.set(address, query);

    return query;
  }

  getMint(pubKey: string | PublicKey | undefined) {
    if (!pubKey) {
      return;
    }

    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    return this.mintCache.get(key);
  }

  getAllMints() {
    return this.mintCache;
  }

  hasMint(pubKey: string | PublicKey | undefined): boolean {
    if (!pubKey) {
      return false;
    }

    const key = pubKey instanceof PublicKey ? pubKey.toBase58() : pubKey;
    return this.mintCache.has(key);
  }

  addMint(pubKey: PublicKey, obj: AccountInfo<Buffer | ParsedAccountData>) {
    if (!isAccountInfoBuffer(obj)) {
      return undefined;
    }
    const mint = deserializeMint(obj.data);
    const id = pubKey.toBase58();
    this.pendingMintCalls.delete(id);
    this.mintCache.set(id, mint);
    return mint;
  }

  addMintInfoMap(mintInfoMap: MintInfoMap) {
    for (const [mintAddress, rawMintInfo] of Object.entries(mintInfoMap)) {
      const { freezeAuthority, mintAuthority, supply } = rawMintInfo;
      const mintInfo: MintInfo = {
        ...rawMintInfo,
        freezeAuthority: freezeAuthority ? new PublicKey(freezeAuthority) : null,
        mintAuthority: mintAuthority ? new PublicKey(mintAuthority) : null,
        supply: new u64(supply),
      };
      this.mintCache.set(mintAddress, mintInfo);
    }
  }

  getCachedAccount(predicate: AccountPredicate) {
    for (const account of this.genericCache.values()) {
      if (predicate(account)) {
        return account as TokenAccount;
      }
    }
  }

  clear() {
    this.genericCache.clear();
    this.mintCache.clear();
    this.emitter.raiseCacheCleared();
  }
}
