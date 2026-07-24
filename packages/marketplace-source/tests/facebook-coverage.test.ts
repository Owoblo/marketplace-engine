import {describe,expect,it} from "vitest";
import {filterFacebookListingsForCoverage,isFacebookListingInCoverage} from "../src/facebook-coverage.js";
import type {NormalizedListing} from "@marketplace-engine/shared";

const bounds={west:-83.2,east:-82.45,south:41.9,north:42.45};
const listing=(overrides:Partial<NormalizedListing>={}):NormalizedListing=>({
  sourceType:"facebook_marketplace",
  externalListingId:"1",
  listingUrl:"https://www.facebook.com/marketplace/item/1/",
  title:"Sectional",
  currency:"CAD",
  imageUrls:[],
  status:"active",
  rawSourcePayload:{},
  ...overrides,
});

describe("Facebook detail coverage policy",()=>{
  it("rejects explicit Michigan locations before detail processing",()=>{
    expect(isFacebookListingInCoverage(listing({locationText:"Allen Park, MI"}),bounds)).toBe(false);
    expect(isFacebookListingInCoverage(listing({locationText:"Detroit, Michigan"}),bounds)).toBe(false);
  });

  it("rejects coordinates outside the canonical region cell coverage",()=>{
    expect(isFacebookListingInCoverage(listing({latitude:42.33,longitude:-83.05}),bounds)).toBe(true);
    expect(isFacebookListingInCoverage(listing({latitude:42.33,longitude:-83.25}),bounds)).toBe(false);
  });

  it("keeps Canadian results with location text but no exact coordinates",()=>{
    expect(filterFacebookListingsForCoverage([
      listing({externalListingId:"ca",locationText:"Windsor, Ontario"}),
      listing({externalListingId:"us",locationText:"Troy, MI"}),
    ],bounds).map(item=>item.externalListingId)).toEqual(["ca"]);
  });
});
