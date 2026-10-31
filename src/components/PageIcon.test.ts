import { describe, expect, it } from "vitest";
import { pickIconName } from "./PageIcon";

describe("pickIconName", () => {
  it.each([
    ["Getting started", "rocket"],
    ["Printing your templates", "printer"],
    ["Licensing & business use", "briefcase"],
    ["Estimate & Quote PDF Generator", "receipt"],
    ["Etsy CSV Profit Calculator", "table"],
    ["Etsy Profit Calculator", "chart"],
    ["If the download button is greyed out", "clock"],
    ["Something else entirely", "help"],
  ])("%s → %s", (title, icon) => {
    expect(pickIconName(title)).toBe(icon);
  });
});
