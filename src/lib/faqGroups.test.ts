import { describe, expect, it } from "vitest";
import { faqGroupId, groupFaqs } from "./faqGroups";

describe("faqGroups", () => {
  it("builds stable anchor ids", () => {
    expect(faqGroupId("Refunds & support")).toBe("faq-group-refunds-support");
    expect(faqGroupId("")).toBe("faq-group-general");
  });

  it("groups in first-seen order and defaults missing groups", () => {
    const groups = groupFaqs([
      { group: "B", id: 1 },
      { group: "", id: 2 },
      { group: "B", id: 3 },
      { id: 4 },
    ] as Array<{ group?: string; id: number }>);

    expect(groups.map((g) => [g.group, g.faqs.map((f) => f.id)])).toEqual([
      ["B", [1, 3]],
      ["General", [2, 4]],
    ]);
  });
});
