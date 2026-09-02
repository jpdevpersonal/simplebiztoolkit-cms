import { describe, expect, it } from "vitest";
import {
  getStarSellerLabel,
  isAffirmativeStat,
  isStatName,
  isYesNoStat,
  toVisibleStatMap,
  toYesNoStatValue,
  validateStatValue,
  type SiteStat,
} from "./stats";

function stat(partial: Partial<SiteStat>): SiteStat {
  return {
    id: 1,
    name: "rating",
    value: "4.9",
    hidden: false,
    ...partial,
  };
}

describe("stats helpers", () => {
  describe("isStatName", () => {
    it("accepts the supported stat names", () => {
      expect(isStatName("rating")).toBe(true);
      expect(isStatName("reviews")).toBe(true);
      expect(isStatName("sales")).toBe(true);
      expect(isStatName("star-seller")).toBe(true);
    });

    it("rejects unknown names", () => {
      expect(isStatName("followers")).toBe(false);
    });
  });

  describe("toVisibleStatMap", () => {
    it("maps visible stats by name without numeric conversion", () => {
      const map = toVisibleStatMap([
        stat({ id: 1, name: "rating", value: "4.9" }),
        stat({ id: 2, name: "reviews", value: "1250" }),
        stat({ id: 3, name: "sales", value: "2500+" }),
      ]);

      expect(map).toEqual({
        rating: "4.9",
        reviews: "1250",
        sales: "2500+",
      });
    });

    it("omits hidden, blank and unknown stats", () => {
      const map = toVisibleStatMap([
        stat({ id: 1, name: "rating", value: "4.9", hidden: true }),
        stat({ id: 2, name: "reviews", value: "   " }),
        stat({ id: 3, name: "followers", value: "10" }),
        stat({ id: 4, name: "sales", value: " 2500+ " }),
      ]);

      expect(map).toEqual({ sales: "2500+" });
    });

    it("returns an empty map for missing data", () => {
      expect(toVisibleStatMap(undefined)).toEqual({});
      expect(toVisibleStatMap(null)).toEqual({});
      expect(toVisibleStatMap([])).toEqual({});
    });

    it("normalises stat name casing", () => {
      expect(
        toVisibleStatMap([stat({ name: "Star-Seller", value: "Yes" })]),
      ).toEqual({ "star-seller": "Yes" });
    });
  });

  describe("isAffirmativeStat", () => {
    it.each(["Yes", "y", "TRUE", "1"])("treats %s as affirmative", (value) => {
      expect(isAffirmativeStat(value)).toBe(true);
    });

    it.each(["No", "false", "0", "", undefined])(
      "treats %s as not affirmative",
      (value) => {
        expect(isAffirmativeStat(value)).toBe(false);
      },
    );
  });

  describe("isYesNoStat", () => {
    it("only treats star-seller as a Yes/No stat", () => {
      expect(isYesNoStat("star-seller")).toBe(true);
      expect(isYesNoStat("rating")).toBe(false);
      expect(isYesNoStat("reviews")).toBe(false);
      expect(isYesNoStat("sales")).toBe(false);
    });
  });

  describe("toYesNoStatValue", () => {
    it("coerces any stored representation to Yes or No", () => {
      expect(toYesNoStatValue("true")).toBe("Yes");
      expect(toYesNoStatValue("1")).toBe("Yes");
      expect(toYesNoStatValue("No")).toBe("No");
      expect(toYesNoStatValue("")).toBe("No");
      expect(toYesNoStatValue(undefined)).toBe("No");
    });
  });

  describe("getStarSellerLabel", () => {
    it("returns the badge label for affirmative values", () => {
      expect(getStarSellerLabel("Yes")).toBe("Etsy Star Seller");
    });

    it("returns null for negative or empty values", () => {
      expect(getStarSellerLabel("No")).toBeNull();
      expect(getStarSellerLabel("0")).toBeNull();
      expect(getStarSellerLabel(" ")).toBeNull();
      expect(getStarSellerLabel(undefined)).toBeNull();
    });

    it("uses custom text as the badge label", () => {
      expect(getStarSellerLabel("Top Rated")).toBe("Top Rated");
    });
  });

  describe("validateStatValue", () => {
    it("requires a value", () => {
      expect(validateStatValue("   ")).toBe("Enter a value.");
    });

    it("rejects values longer than 10 characters", () => {
      expect(validateStatValue("12345678901")).toBe(
        "Value must be 10 characters or fewer (currently 11).",
      );
    });

    it("accepts values of exactly 10 characters", () => {
      expect(validateStatValue("1234567890")).toBeNull();
    });
  });
});
