import {describe,expect,it} from "vitest";
import {fallbackSellerExternalId} from "../src/pipeline.js";

describe("fallback seller identity",()=>{
  it("normalizes case, whitespace, and apostrophes deterministically",()=>{
    expect(fallbackSellerExternalId("  O’Neil   Movers ")).toBe("fallback-name:o'neil movers");
    expect(fallbackSellerExternalId("o`neil movers")).toBe("fallback-name:o'neil movers");
  });
});
