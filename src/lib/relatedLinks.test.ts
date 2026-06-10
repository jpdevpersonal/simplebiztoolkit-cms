import { describe, expect, it } from "vitest";
import {
  extractRelatedLinksBlocksFromHtml,
  sanitizeRelatedLinksItems,
  serializeRelatedLinksBlockToHtml,
} from "./relatedLinks";

describe("relatedLinks serialization", () => {
  it("round-trips a saved block through HTML attributes", () => {
    const html = serializeRelatedLinksBlockToHtml({
      title: "Related to this",
      backgroundColor: "#f8f9fb",
      borderWidth: 2,
      imageSize: "large",
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
          imagePositionY: 0,
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
      imageSize: "large",
      items: [
        expect.objectContaining({
          kind: "template",
          refId: "template-1",
          href: "/templates/payroll/payroll-checklist",
          destinationTitle: "Payroll checklist",
          label: "Payroll starter kit",
          imageUrl: "/images/payroll-kit.webp",
          imagePositionY: 0,
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

  it("round-trips a custom external link", () => {
    const html = serializeRelatedLinksBlockToHtml({
      title: "Related to this",
      items: [
        {
          uid: "link-1",
          kind: "custom",
          refId: "",
          href: "https://example.com/resources",
          destinationTitle: "https://example.com/resources",
          label: "Example resources",
          imageId: null,
          imageUrl: null,
          imageAlt: null,
          imagePositionY: 50,
        },
      ],
    });

    const { blocks } = extractRelatedLinksBlocksFromHtml(html);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].items).toEqual([
      expect.objectContaining({
        kind: "custom",
        href: "https://example.com/resources",
        label: "Example resources",
      }),
    ]);
  });
});

describe("sanitizeRelatedLinksItems custom links", () => {
  it("accepts custom links with external or internal hrefs without a refId", () => {
    const items = sanitizeRelatedLinksItems([
      {
        uid: "link-1",
        kind: "custom",
        refId: "",
        href: "https://example.com/page",
        destinationTitle: "",
        label: "External page",
      },
      {
        uid: "link-2",
        kind: "custom",
        refId: "",
        href: "/internal-path",
        destinationTitle: "",
        label: null,
      },
      {
        uid: "link-3",
        kind: "custom",
        refId: "",
        href: "www.example.com/resources?source=related#top",
        destinationTitle: "",
        label: null,
      },
    ]);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      kind: "custom",
      href: "https://example.com/page",
      destinationTitle: "External page",
      label: "External page",
    });
    expect(items[1]).toMatchObject({
      kind: "custom",
      href: "/internal-path",
      destinationTitle: "/internal-path",
    });
    expect(items[2]).toMatchObject({
      kind: "custom",
      href: "https://www.example.com/resources?source=related#top",
      destinationTitle: "https://www.example.com/resources?source=related#top",
    });
  });

  it("rejects custom links with unsafe or invalid hrefs", () => {
    const items = sanitizeRelatedLinksItems([
      {
        uid: "link-1",
        kind: "custom",
        refId: "",
        href: "javascript:alert(1)",
        destinationTitle: "Bad",
        label: "Bad",
      },
      {
        uid: "link-2",
        kind: "custom",
        refId: "",
        href: "//evil.example.com",
        destinationTitle: "Bad",
        label: "Bad",
      },
      {
        uid: "link-3",
        kind: "custom",
        refId: "",
        href: "",
        destinationTitle: "Empty",
        label: "Empty",
      },
    ]);

    expect(items).toEqual([]);
  });

  it("still requires refId and destinationTitle for page and template links", () => {
    const items = sanitizeRelatedLinksItems([
      {
        uid: "link-1",
        kind: "page",
        refId: "",
        href: "/some-page",
        destinationTitle: "Some page",
      },
    ]);

    expect(items).toEqual([]);
  });
});
