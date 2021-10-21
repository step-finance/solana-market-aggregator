import {
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { Buffer } from "buffer";

export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(
    0,
    new Array(Math.ceil(array.length / size))
  ).map((_, index) => array.slice(index * size, (index + 1) * size));
}

export const getMultipleAccounts = async (
  connection: Connection,
  keys: string[],
  commitment: Commitment
): Promise<{
  keys: string[];
  array: AccountInfo<Buffer>[];
}> => {
  const publicKeys = keys.map((key) => new PublicKey(key));
  const result = (
    await Promise.all(
      chunks(publicKeys, 99).map((chunk) =>
        connection.getMultipleAccountsInfo(chunk, commitment)
      )
    )
  ).flat();
  const keysThatExist: string[] = [];
  const array: AccountInfo<Buffer>[] = [];
  for (let i = 0; i < result.length; i++) {
    const account = result[i];
    if (account) {
      keysThatExist.push(keys[i]);
      array.push(account);
    }
  }

  return { keys: keysThatExist, array };
};
