import { describe, it, expect } from "vitest";
import { coverageHelper } from "./_coverage_helper";

describe("coverageHelper", () => {
  it("returns yes when true", () => {
    expect(coverageHelper(true)).toBe("yes");
  });

  it("returns no when false", () => {
    expect(coverageHelper(false)).toBe("no");
  });
});
