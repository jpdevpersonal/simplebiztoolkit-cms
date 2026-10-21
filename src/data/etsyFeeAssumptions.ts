export type SellerCountry = "GB" | "US" | "custom";

export interface EtsyFeeAssumption {
  transactionPct: number;
  paymentPct: number;
  paymentFixed: number;
  listingFee: number;
  regulatoryPct: number;
  currency: "GBP" | "USD";
  listingFeeIsEstimate: boolean;
}

export const ETSY_FEE_VERIFIED_AS_OF = "2026-10-21";

export const ETSY_FEE_SOURCES = {
  paymentProcessing:
    "https://help.etsy.com/hc/en-us/articles/115015628847-What-are-Payment-Processing-Fees-for-Selling-on-Etsy",
  regulatoryOperating:
    "https://help.etsy.com/hc/en-us/articles/1500011073202-What-is-a-Regulatory-Operating-Fee",
  transactionAndOtherFees:
    "https://help.etsy.com/hc/en-us/articles/115014483627-What-are-the-Fees-and-Taxes-for-Selling-on-Etsy",
  listing:
    "https://help.etsy.com/hc/en-us/articles/360000344908-Fees-and-Listing-Multiple-Quantities",
  offsiteAds:
    "https://help.etsy.com/hc/en-us/articles/360000338367-How-Etsy-s-Offsite-Ads-Work",
} as const;

export const ETSY_FEE_ASSUMPTIONS: Record<
  Exclude<SellerCountry, "custom">,
  EtsyFeeAssumption
> = {
  GB: {
    transactionPct: 6.5,
    paymentPct: 4,
    paymentFixed: 0.2,
    listingFee: 0.16,
    regulatoryPct: 0.48,
    currency: "GBP",
    listingFeeIsEstimate: true,
  },
  US: {
    transactionPct: 6.5,
    paymentPct: 3,
    paymentFixed: 0.25,
    listingFee: 0.2,
    regulatoryPct: 0,
    currency: "USD",
    listingFeeIsEstimate: false,
  },
};
