import { expect } from "chai";
import "mocha";

import { getStarAtlasData } from "../src/utils/star-atlas";

describe("Star Atlas", () => {
  it("Handle multiple markets", async () => {
    const { markets } = await getStarAtlasData("mainnet-beta");
    expect(markets['PX4/USDC']).to.not.equal(undefined);
  });
});
