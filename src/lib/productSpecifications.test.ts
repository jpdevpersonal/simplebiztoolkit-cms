import { describe, expect, it } from "vitest";
import { getProductSpecifications } from "./productSpecifications";

describe("getProductSpecifications", () => {
  it("returns only explicitly provided product attributes", () => {
    expect(
      getProductSpecifications({
        fileFormats: ["Excel"],
        printable: false,
        fillable: false,
        supportedApplications: ["Microsoft Excel"],
        paperSizes: [],
      }),
    ).toEqual([
      { name: "File format", value: "Excel" },
      { name: "Printable", value: "No" },
      { name: "Fillable fields", value: "No" },
      { name: "Supported applications", value: "Microsoft Excel" },
    ]);
  });

  it.each(["PDF", "Word"])(
    "preserves the verified %s format without inventing PDF attributes",
    (format) => {
      const specifications = getProductSpecifications({
        fileFormats: [format as "PDF" | "Word"],
      });

      expect(specifications).toEqual([{ name: "File format", value: format }]);
    },
  );

  it("omits uncertain legacy formats, sizes, prices and licence claims", () => {
    expect(getProductSpecifications({})).toEqual([]);
  });

  it("includes only an explicitly supplied licence description", () => {
    expect(
      getProductSpecifications({ licenseDescription: "Personal use only" }),
    ).toEqual([{ name: "License", value: "Personal use only" }]);
    expect(
      getProductSpecifications({ licenseDescription: "  " }),
    ).toEqual([]);
  });
});
