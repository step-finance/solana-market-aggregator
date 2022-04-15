import type { AccountInfo, Commitment, Connection, ParsedAccountData } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(0, new Array(Math.ceil(array.length / size))).map((_, index) =>
    array.slice(index * size, (index + 1) * size),
  );
}

export const isAccountInfoBuffer = (
  accountInfo: AccountInfo<Buffer | ParsedAccountData>,
): accountInfo is AccountInfo<Buffer> => Buffer.isBuffer(accountInfo.data);

export const getMultipleAccounts = async (
  connection: Connection,
  keys: string[],
  commitment: Commitment,
): Promise<{
  keys: string[];
  array: AccountInfo<Buffer | ParsedAccountData>[];
}> => {
  const publicKeys = keys.map((key) => new PublicKey(key));
  const result = (
    await Promise.all(chunks(publicKeys, 99).map((chunk) => connection.getMultipleAccountsInfo(chunk, commitment)))
  ).flat();
  const keysThatExist: string[] = [];
  const array: AccountInfo<Buffer | ParsedAccountData>[] = [];
  for (let i = 0; i < result.length; i++) {
    const key = keys[i];
    const account = result[i];
    if (key && account) {
      keysThatExist.push(key);
      array.push(account);
    }
  }

  return { keys: keysThatExist, array };
};
