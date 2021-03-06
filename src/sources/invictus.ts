import type { Provider } from "@saberhq/solana-contrib";
import { SolanaReadonlyProvider } from "@saberhq/solana-contrib";
import { getMintInfo, getTokenAccount } from "@saberhq/token-utils";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import type { MarketDataMap } from "../types/marketdata";
import type { MarketSource } from "./marketsource";

export const INVICTUS_MINT = "inL8PMVd6iiW3RCBJnr5AsrRN6nqr4BTrcNuQWQSkvY";
export const STAKED_INVICTUS_MINT = "sinjBMHhAuvywW3o87uXHswuRXb3c7TfqgAdocedtDj";
const STAKED_INVICTUS_VAULT = "5EZiwr4fE1rbxpzQUWQ6N9ppkEridNwbH3dU3xUf7wPZ";
const LOCKED_STAKED_INVICTUS_VAULT = "oybxAeqZ1zqricePm6skfNVtY9uHhACzazoKvcUXKXA";
export const LOCKED_STAKED_INVICTUS_MINT = "LsinpBtQH68hzHqrvWw4PYbH7wMoAobQAzcvxVHwTLv";
/**
 * A class that retrieves market price of sIN & lsIN
 */
export class StakedInvictusMarketSource implements MarketSource {
  readonly connection: Connection;
  readonly provider: Provider;

  /**
   * Create the class
   *
   * @param connection Web3 Connection
   */
  constructor(connection: Connection) {
    this.connection = connection;
    this.provider = new SolanaReadonlyProvider(connection) as unknown as Provider;
  }

  /**
   * Queries the latest sIN price
   *
   * @return Object containing sIN and lsIN market data
   */
  async query(marketDataMap: MarketDataMap): Promise<MarketDataMap> {
    const invictusMarketData = marketDataMap[INVICTUS_MINT];
    if (!invictusMarketData) {
      return {};
    }

    const stakedVault = await getTokenAccount(this.provider, new PublicKey(STAKED_INVICTUS_VAULT));
    const stakedInvictusMint = await getMintInfo(this.provider, new PublicKey(STAKED_INVICTUS_MINT));
    const totalInvictusStaked = stakedVault.amount.toNumber();
    const invictusRatio = totalInvictusStaked / stakedInvictusMint.supply.toNumber();

    const stakedInvictusPrice = invictusMarketData.price * invictusRatio;

    const lockedStakedVault = await getTokenAccount(this.provider, new PublicKey(LOCKED_STAKED_INVICTUS_VAULT));
    const lockedStakedInvictusMint = await getMintInfo(this.provider, new PublicKey(LOCKED_STAKED_INVICTUS_MINT));
    const totalInvictusLockedStaked = lockedStakedVault.amount.toNumber();
    const lockedInvictusRatio = totalInvictusLockedStaked / lockedStakedInvictusMint.supply.toNumber();

    const lockedStakedInvictusPrice = invictusMarketData.price * lockedInvictusRatio;

    return {
      [STAKED_INVICTUS_MINT]: {
        source: "contract",
        symbol: "sIN",
        address: STAKED_INVICTUS_MINT,
        price: stakedInvictusPrice,
      },
      [LOCKED_STAKED_INVICTUS_MINT]: {
        source: "contract",
        symbol: "lsIN",
        address: LOCKED_STAKED_INVICTUS_MINT,
        price: lockedStakedInvictusPrice,
      },
    };
  }
}
