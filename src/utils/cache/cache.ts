import { deserializeMint } from "@saberhq/token-utils";
import { MintInfo, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";

import { MintInfoMap, TokenAccount } from "../../types";
import { BaseError } from "../errors";
import { EventEmitter } from "./emitter";
import {
  AccountParser,
  ParsedAccountBase,
  ParsedLocalTransaction,
  TokenAccountParser,
} from "../parsers";

// Arbitrary mint to represent SOL (not wrapped SOL).
const SOL_MINT = new PublicKey("Ejmc1UB4EsES5oAaRN63SpoxMJidt3ZGBrqrZk49vjTZ");

const getMintInfo = async (connection: Connection, pubKey: PublicKey) => {
  const info = await connection.getAccountInfo(pubKey);
  if (info === null) {
    throw new Error("Failed to find mint account");
  }

  const data = Buffer.from(info.data);

  return deserializeMint(data);
};

export class AccountNotFoundError extends BaseError {}

const pendingMintCalls = new Map<string, Promise<MintInfo>>();
const pendingCalls = new Map<string, Promise<ParsedAccountBase>>();
const genericCache = new Map<string, ParsedAccountBase>();
const mintCache = new Map<string, MintInfo>();
const transactionCache = new Map<string, ParsedLocalTransaction | null>();
const keyToAccountParser = new Map<string, AccountParser>();

// eslint-disable-next-line no-unused-vars
type AccountPredicate = (account: TokenAccount) => boolean;
export const getCachedAccount = (predicate: AccountPredicate) => {
  for (const account of genericCache.values()) {
    if (predicate(account)) {
      return account as TokenAccount;
    }
  }
};

export const precacheUserTokenAccounts = async (
  connection: Connection,
  owner?: PublicKey
) => {
  if (!owner) {
    return;
  }

  // user accounts are update via ws subscription
  const accounts = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const currentAccounts = Array.from(genericCache.values());
  const userAcc = currentAccounts.filter((a) => {
    if (a === undefined) {
      return false;
    }
    if (a.info && a.info.mint && a.info.mint.equals(SOL_MINT)) {
      return false;
    }
    return a.info && a.info.owner && a.info.owner.equals(owner);
  });

  userAcc.forEach((account) => {
    cache.delete(account.pubkey);
  });

  accounts.value.forEach((info) => {
    cache.add(info.pubkey, info.account, TokenAccountParser);
  });
};

export const cache = {
  emitter: new EventEmitter(),
  query: async (
    connection: Connection,
    pubKey: string | PublicKey,
    parser?: AccountParser
  ) => {
    let id: PublicKey;
    if (typeof pubKey === "string") {
      id = new PublicKey(pubKey);
    } else {
      id = pubKey;
    }

    const address = id.toBase58();

    let account = genericCache.get(address);
    if (account) {
      return account;
    }

    let query = pendingCalls.get(address);
    if (query) {
      return query;
    }

    query = connection.getAccountInfo(id).then((data) => {
      if (!data) {
        throw new AccountNotFoundError(
          `Account not found with address ID ${id.toBase58()}`
        );
      }

      return cache.add(id, data, parser);
    }) as Promise<TokenAccount>;
    pendingCalls.set(address, query as any);

    return query;
  },
  add: (
    id: PublicKey | string,
    obj: AccountInfo<Buffer>,
    parser?: AccountParser
  ) => {
    if (obj.data.length === 0) {
      return;
    }

    const address = typeof id === "string" ? id : id?.toBase58();
    const deserialize = parser ? parser : keyToAccountParser.get(address);
    if (!deserialize) {
      throw new Error(
        "Deserializer needs to be registered or passed as a parameter"
      );
    }

    cache.registerParser(id, deserialize);
    pendingCalls.delete(address);
    const account = deserialize(new PublicKey(address), obj);
    if (!account) {
      return;
    }

    const isNew = !genericCache.has(address);
    genericCache.set(address, account);
    cache.emitter.raiseCacheUpdated(address, isNew, deserialize);
    return account;
  },
  has: (pubKey: string | PublicKey): boolean => {
    const key = pubKey instanceof PublicKey ? pubKey.toBase58() : pubKey;
    return genericCache.has(key);
  },
  get: (pubKey: string | PublicKey) => {
    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    return genericCache.get(key);
  },
  getAll: () => {
    return genericCache;
  },
  delete: (pubKey: string | PublicKey) => {
    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    if (genericCache.get(key)) {
      genericCache.delete(key);
      cache.emitter.raiseCacheDeleted(key);
      return true;
    }
    return false;
  },
  byParser: (parser: AccountParser) => {
    const result: string[] = [];
    for (const id of keyToAccountParser.keys()) {
      if (keyToAccountParser.get(id) === parser) {
        result.push(id);
      }
    }

    return result;
  },
  registerParser: (pubkey: PublicKey | string, parser: AccountParser) => {
    if (pubkey) {
      const address = typeof pubkey === "string" ? pubkey : pubkey?.toBase58();
      keyToAccountParser.set(address, parser);
    }

    return pubkey;
  },
  queryMint: async (connection: Connection, pubKey: string | PublicKey) => {
    let id: PublicKey;
    if (typeof pubKey === "string") {
      id = new PublicKey(pubKey);
    } else {
      id = pubKey;
    }

    const address = id.toBase58();
    let mint = mintCache.get(address);
    if (mint) {
      return mint;
    }

    let query = pendingMintCalls.get(address);
    if (query) {
      return query;
    }

    query = getMintInfo(connection, id).then((data) => {
      pendingMintCalls.delete(address);

      mintCache.set(address, data);
      return data;
    });
    pendingMintCalls.set(address, query);

    return query;
  },
  getMint: (pubKey: string | PublicKey | undefined) => {
    if (!pubKey) {
      return;
    }

    let key: string;
    if (typeof pubKey !== "string") {
      key = pubKey.toBase58();
    } else {
      key = pubKey;
    }

    return mintCache.get(key);
  },
  getAllMints: () => {
    return mintCache;
  },
  hasMint: (pubKey: string | PublicKey | undefined): boolean => {
    if (!pubKey) {
      return false;
    }

    const key = pubKey instanceof PublicKey ? pubKey.toBase58() : pubKey;
    return mintCache.has(key);
  },
  addMint: (pubKey: PublicKey, obj: AccountInfo<Buffer>) => {
    const mint = deserializeMint(obj.data);
    const id = pubKey.toBase58();
    pendingMintCalls.delete(id);
    mintCache.set(id, mint);
    return mint;
  },
  addMintInfoMap: (mintInfoMap: MintInfoMap) => {
    for (const [mintAddress, rawMintInfo] of Object.entries(mintInfoMap)) {
      const { freezeAuthority, mintAuthority, supply } = rawMintInfo;
      const mintInfo: MintInfo = {
        ...rawMintInfo,
        freezeAuthority: freezeAuthority
          ? new PublicKey(freezeAuthority)
          : null,
        mintAuthority: mintAuthority ? new PublicKey(mintAuthority) : null,
        supply: new u64(supply),
      };
      mintCache.set(mintAddress, mintInfo);
    }
  },
  addTransaction: (signature: string, tx: ParsedLocalTransaction | null) => {
    transactionCache.set(signature, tx);
    return tx;
  },
  addBulkTransactions: (txs: Array<ParsedLocalTransaction>) => {
    for (const tx of txs) {
      transactionCache.set(tx.signature.signature, tx);
    }
    return txs;
  },
  getTransaction: (signature: string) => {
    const transaction = transactionCache.get(signature);
    return transaction;
  },
  getAllTransactions: () => {
    return transactionCache;
  },
  clear: () => {
    genericCache.clear();
    transactionCache.clear();
    cache.emitter.raiseCacheCleared();
  },
};
