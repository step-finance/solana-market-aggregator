import { expect } from "chai";
import "mocha";

import { getStarAtlasData } from "../src/utils/star-atlas";

describe("Star Atlas", () => {
  it("Handles multiple markets", async () => {
    const { markets } = await getStarAtlasData("mainnet-beta");
    expect(markets).to.deep.include({
      address: "MTc1macY8G2v1MubFxDp4W8cooaSBUZvc2KqaCNwhQE",
      baseMintAddress: "2iMhgB4pbdKvwJHVyitpvX5z1NBNypFonUgaSAt9dtDt",
      deprecated: false,
      name: "PX4/USDC",
      programId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    });
  });
});
