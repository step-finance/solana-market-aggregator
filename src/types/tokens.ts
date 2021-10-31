import { TokenExtensions, TokenInfo } from "@solana/spl-token-registry";

export type TokenMap = {
  [address: string]: TokenInfo;
};

export type MinimalTokenInfo = Omit<TokenInfo, "extensions"> & {
  readonly extensions?: Pick<
    TokenExtensions,
    "coingeckoId" | "website" | "serumV3Usdc" | "serumV3Usdt"
  >;
};

export type MinimalTokenMap = {
  [address: string]: MinimalTokenInfo;
};
