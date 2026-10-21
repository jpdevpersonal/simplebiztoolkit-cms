import { describe, expect, it } from "vitest";
import {
  ETSY_FEE_ASSUMPTIONS,
  ETSY_FEE_SOURCES,
  ETSY_FEE_VERIFIED_AS_OF,
} from "./etsyFeeAssumptions";

describe("Etsy fee assumptions", () => {
  it("keeps seller-country payment and regulatory rates distinct", () => {
    expect(ETSY_FEE_ASSUMPTIONS.GB).toMatchObject({
      paymentPct: 4,
      paymentFixed: 0.2,
      regulatoryPct: 0.48,
      currency: "GBP",
    });
    expect(ETSY_FEE_ASSUMPTIONS.US).toMatchObject({
      paymentPct: 3,
      paymentFixed: 0.25,
      regulatoryPct: 0,
      currency: "USD",
    });
    expect(ETSY_FEE_ASSUMPTIONS.GB.listingFeeIsEstimate).toBe(true);
  });

  it("records official sources and a checked date", () => {
    expect(ETSY_FEE_VERIFIED_AS_OF).toBe("2026-10-21");
    expect(Object.values(ETSY_FEE_SOURCES).every((url) => url.startsWith("https://help.etsy.com/"))).toBe(true);
  });
});
