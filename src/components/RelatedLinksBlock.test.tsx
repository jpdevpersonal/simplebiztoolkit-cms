import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RelatedLinksBlock from "./RelatedLinksBlock";
import type { RelatedLinkItem } from "@/lib/relatedLinks";

function makeItem(overrides: Partial<RelatedLinkItem> = {}): RelatedLinkItem {
  return {
    uid: overrides.uid ?? "item-1",
    kind: overrides.kind ?? "page",
    refId: overrides.refId ?? "",
    href: overrides.href ?? "",
    destinationTitle: overrides.destinationTitle ?? "",
    label: overrides.label ?? null,
    imageId: overrides.imageId ?? null,
    imageUrl: overrides.imageUrl ?? null,
    imageAlt: overrides.imageAlt ?? null,
    imagePositionY: overrides.imagePositionY ?? 50,
  };
}

describe("RelatedLinksBlock", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(
      <RelatedLinksBlock title="Related" items={[]} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders anchors and prefers trimmed visible label over destinationTitle", () => {
    const items = [
      makeItem({
        uid: "a",
        href: "/a",
        destinationTitle: "Page A",
        label: "  Custom label  ",
      }),
      makeItem({
        uid: "b",
        href: "/b",
        destinationTitle: "Page B",
        label: null,
      }),
    ];

    const { container } = render(
      <RelatedLinksBlock title="Related" items={items} />,
    );

    // Both labels should be visible (first trimmed, second falls back to destinationTitle)
    expect(screen.getByText("Custom label")).toBeInTheDocument();
    expect(screen.getByText("Page B")).toBeInTheDocument();

    // Anchors should have correct hrefs
    const anchors = container.querySelectorAll("a.related-links-block__link");
    expect(anchors[0]).toHaveAttribute("href", "/a");
    expect(anchors[1]).toHaveAttribute("href", "/b");
  });

  it("renders images and clamps/rounds object position values, and exposes sizes when imageSize set", () => {
    const items = [
      makeItem({
        uid: "i1",
        href: "/i1",
        destinationTitle: "I1",
        imageUrl: "/img1.webp",
        imagePositionY: 12.6,
      }),
      makeItem({
        uid: "i2",
        href: "/i2",
        destinationTitle: "I2",
        imageUrl: "/img2.webp",
        imagePositionY: -20,
      }),
      makeItem({
        uid: "i3",
        href: "/i3",
        destinationTitle: "I3",
        imageUrl: "/img3.webp",
        imagePositionY: 150,
      }),
    ];

    const { container } = render(
      <RelatedLinksBlock title="Related" items={items} imageSize="large" />,
    );

    // Section should include image-size class for the provided imageSize
    const section = container.querySelector("section.related-links-block");
    expect(section).toBeTruthy();
    expect(
      section?.classList.contains("related-links-block--image-size-large"),
    ).toBe(true);

    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(3);

    // sizes attribute should reflect the large spec (mobile 128, desktop 144)
    expect(imgs[0].getAttribute("sizes")).toBe(
      "(max-width: 768px) 128px, 144px",
    );

    // objectPosition is set as `center X%` where X is clamped and rounded
    expect(imgs[0].style.objectPosition).toBe("center 13%");
    expect(imgs[1].style.objectPosition).toBe("center 0%");
    expect(imgs[2].style.objectPosition).toBe("center 100%");
  });
});
