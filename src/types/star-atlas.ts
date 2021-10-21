export interface StarAtlasNFT {
  _id: string;
  deactivated: boolean;
  name: string;
  description: string;
  image: string;
  media: {
    qrInstagram: string;
    qrFacebook: string;
    audio: string;
    sketchfab: string;
    thumbnailUrl?: string;
  };
  attributes: {
    itemType: string;
    rarity: string;
    tier?: number;
    class: string;
    score?: number;
    musician?: string;
    spec?: string;
    category?: string;
    crewSlots?: number;
    componentSlots?: number;
    moduleSlots?: number;
    unitLength?: number;
    unitWidth?: number;
    unitHeight?: number;
  };
  symbol: string;
  markets: {
    _id?: string;
    id: string;
    quotePair: string;
    serumProgramId?: string;
  }[];
  totalSupply?: number;
  mint: string;
  network?: string;
  tradeSettings: {
    expireTime?: number;
    saleTime?: number;
    msrp?: {
      value: number;
      currencySymbol: string;
    };
  };
  updatedAt: Date;
  airdrops: {
    _id: string;
    supply: number;
    id: number;
  }[];
  primarySales: {
    _id?: string;
    listTimestamp: number;
    supply?: number;
    price?: number;
    isMinted?: boolean;
    isListed?: boolean;
    mintTimestamp?: number | null;
    orderId?: null;
    expireTimestamp?: number;
  }[];
  musician?: string;
  createdAt?: Date;
}
