import { describe, expect, it } from "vitest";
import {
  extractRelatedLinksBlocksFromHtml,
  serializeRelatedLinksBlockToHtml,
} from "./relatedLinks";

describe("relatedLinks serialization", () => {
  it("round-trips a saved block through HTML attributes", () => {
    const html = serializeRelatedLinksBlockToHtml({
      title: "Related to this",
      backgroundColor: "#f8f9fb",
      borderWidth: 2,
      items: [
        {
          uid: "link-1",
          kind: "template",
          refId: "template-1",
          href: "/templates/payroll/payroll-checklist",
          destinationTitle: "Payroll checklist",
          label: "Payroll starter kit",
          imageId: "img-1",
          imageUrl: "/images/payroll-kit.webp",
          imageAlt: "Payroll starter kit cover",
        },
      ],
    });

    const { htmlWithoutRelatedLinks, blocks } =
      extractRelatedLinksBlocksFromHtml(`<p>Intro</p>${html}<p>Outro</p>`);

    expect(htmlWithoutRelatedLinks).toBe("<p>Intro</p><p>Outro</p>");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      title: "Related to this",
      backgroundColor: "#f8f9fb",
      borderWidth: 2,
      items: [
        expect.objectContaining({
          kind: "template",
          refId: "template-1",
          href: "/templates/payroll/payroll-checklist",
          destinationTitle: "Payroll checklist",
          label: "Payroll starter kit",
          imageUrl: "/images/payroll-kit.webp",
        }),
      ],
    });
  });

  it("omits empty blocks from saved HTML", () => {
    expect(
      serializeRelatedLinksBlockToHtml({
        title: "Related to this",
        items: [],
      }),
    ).toBe("");
  });
});
