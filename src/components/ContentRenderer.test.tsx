import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { encodeRelatedLinksItems } from "@/lib/relatedLinks";
import {
  ContentRenderer,
  DynamicContentRenderer,
  convertContentToHtml,
} from "./ContentRenderer";

describe("ContentRenderer", () => {
  it("renders section and callout content plus footer", () => {
    const html =
      '<section data-component="section"><h2>Section title</h2></section>' +
      '<aside data-component="callout" data-title="Tip">Callout body</aside>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByText("Section title")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(screen.getByText("Callout body")).toBeInTheDocument();
    expect(screen.getByText(/About SimpleBizToolkit/i)).toBeInTheDocument();
  });

  it("renders dynamic HTML on client", () => {
    render(
      <DynamicContentRenderer
        html={`<section data-component="section"><p>Hi</p></section>`}
      />,
    );
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  it("renders article-cta block from HTML data attributes", () => {
    const html =
      '<section data-component="article-cta" data-title="Try Adobe Express" data-description="Faster design workflow" data-primary-label="Explore Adobe Express" data-primary-href="https://example.com" data-show-home-link="true" data-show-etsy-link="false"></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByText("Try Adobe Express")).toBeInTheDocument();
    expect(screen.getByText("Faster design workflow")).toBeInTheDocument();
    expect(screen.getByText("Explore Adobe Express")).toBeInTheDocument();
    expect(screen.getByText("See all templates")).toBeInTheDocument();
  });

  it("renders saved CTA button styles from block HTML", () => {
    const html =
      '<section data-sbt-block="cta"><h2>Styled CTA</h2><p>Styled description</p><a href="/shop" data-button-bg="#123456" data-button-color="#abcdef" data-button-padding="14" data-button-radius="22">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByText("Styled CTA")).toBeInTheDocument();
    expect(screen.getByText("Styled description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveStyle({
      "--sb-btn-bg": "#123456",
      "--sb-btn-bg-hover": "#123456",
      "--sb-btn-color": "#abcdef",
      "--sb-btn-padding": "14px",
      "--sb-btn-radius": "22px",
    });
  });

  it("adds a thin border when a CTA button background is white", () => {
    const html =
      '<section data-sbt-block="cta"><h2>White CTA</h2><p>Styled description</p><a href="/shop" data-button-bg="#ffffff">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByRole("link", { name: "Shop now" })).toHaveStyle({
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "rgba(0, 0, 0, 0.2)",
    });
  });

  it("renders saved CTA section background and border width", () => {
    const html =
      '<section data-sbt-block="cta" data-background-color="#fff4d6" data-border-width="6"><h2>Styled CTA</h2><p>Styled description</p><a href="/shop">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByText("Styled CTA").closest("section")).toHaveStyle({
      background: "#fff4d6",
      borderWidth: "6px",
      borderStyle: "solid",
      borderColor: "#dee2e6",
    });
  });

  it("uses shared primary button classes by default for CTA blocks", () => {
    const html =
      '<section data-sbt-block="cta"><h2>Default CTA</h2><p>Default description</p><a href="/shop">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByRole("link", { name: "Shop now" })).toHaveClass(
      "cta-button",
      "btn",
      "sb-btn-primary",
    );
  });

  it("renders second CTA button styles plus saved gap and alignment", () => {
    const html =
      '<section data-sbt-block="cta" data-button-gap="24"><h2>Dual CTA</h2><p>Styled description</p><div class="sbt-cta-buttons"><div><a href="/primary" data-button-role="primary" data-button-align="left" data-button-bg="#123456">Primary</a></div><div></div><div><a href="/secondary" data-button-role="secondary" data-button-align="right" data-button-bg="#654321" data-button-color="#fedcba" data-button-padding="18" data-button-radius="30">Secondary</a></div></div></section>';

    render(<ContentRenderer html={html} />);

    const secondButton = screen.getByRole("link", { name: "Secondary" });
    expect(secondButton).toHaveStyle({
      "--sb-btn-bg": "#654321",
      "--sb-btn-bg-hover": "#654321",
      "--sb-btn-color": "#fedcba",
      "--sb-btn-padding": "18px",
      "--sb-btn-radius": "30px",
    });

    const layout = screen
      .getByRole("link", { name: "Primary" })
      .closest(".sbt-cta-buttons");
    expect(layout).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    });
    expect(layout?.children[0]).toHaveStyle({ gap: "24px" });
    expect(layout?.children[2]).toHaveStyle({ gap: "24px" });
  });

  it("renders image CTA blocks with linked media and left alignment", () => {
    const html =
      '<section data-sbt-block="cta" data-media-type="image" data-image-alignment="left"><div class="sbt-cta-media-layout"><div><h2>Workbook bundle</h2><p>Preview the template bundle before you buy.</p></div><figure data-cta-media="image"><a href="/templates/workbook-bundle" data-cta-media-link="true"><img src="/images/workbook-bundle.webp" alt="Workbook bundle preview" data-image-id="img-workbook" /></a></figure></div></section>';

    render(<ContentRenderer html={html} />);

    expect(screen.getByText("Workbook bundle")).toBeInTheDocument();
    expect(
      screen.getByText("Preview the template bundle before you buy."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Workbook bundle preview" }),
    ).toHaveAttribute("src", "/images/workbook-bundle.webp");
    expect(
      screen.getByRole("link", { name: "Workbook bundle preview" }),
    ).toHaveAttribute("href", "/templates/workbook-bundle");
    expect(screen.getByText("Workbook bundle").closest("section")).toHaveStyle({
      textAlign: "left",
    });
  });

  it("renders saved CTA title and subtitle levels from block HTML", () => {
    const html =
      '<section data-sbt-block="cta"><h1 data-title-level="h1">Large CTA</h1><p data-text-level="h4">Larger subtitle</p><a href="/shop">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    const heading = screen.getByRole("heading", {
      name: "Large CTA",
      level: 2,
    });

    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveStyle({
      fontSize: "2.25rem",
    });
    expect(screen.getByText("Larger subtitle")).toHaveStyle({
      fontSize: "1.25rem",
    });
  });

  it("maps legacy CTA title and subtitle pixel sizes to heading levels", () => {
    const html =
      '<section data-sbt-block="cta"><h2 data-title-size="42">Legacy CTA</h2><p data-text-size="19">Legacy subtitle</p><a href="/shop">Shop now</a></section>';

    render(<ContentRenderer html={html} />);

    const legacyHeading = screen.getByRole("heading", {
      name: "Legacy CTA",
      level: 2,
    });

    expect(legacyHeading.tagName).toBe("H2");
    expect(legacyHeading).toHaveStyle({
      fontSize: "2.25rem",
    });
    expect(screen.getByText("Legacy subtitle")).toHaveStyle({
      fontSize: "1.25rem",
    });
  });

  it("converts JSX-like tags to data-component HTML", () => {
    const converted = convertContentToHtml(
      '<Section><p>Hello</p></Section><Callout title="A">B</Callout><ContentCta title="Try" />',
    );

    expect(converted).toContain('data-component="section"');
    expect(converted).toContain('data-component="callout"');
    expect(converted).toContain('data-component="article-cta"');
  });

  it("renders plain HTML when no structured blocks are present", () => {
    render(<ContentRenderer html="<p>Loose paragraph</p>" />);

    expect(screen.getByText("Loose paragraph")).toBeInTheDocument();
    expect(screen.getByText(/About SimpleBizToolkit/i)).toBeInTheDocument();
  });

  it("falls back to info styling for unknown callout tones", () => {
    render(
      <ContentRenderer
        html={
          '<div data-sbt-block="callout" data-tone="custom"><p>Fallback callout</p></div>'
        }
      />,
    );

    expect(
      screen.getByText("Fallback callout").closest(".sbt-callout"),
    ).toHaveStyle({
      borderLeft: "4px solid #3b82f6",
      background: "#eff6ff",
    });
  });

  it("renders image blocks with captions", () => {
    render(
      <ContentRenderer
        html={
          '<figure data-sbt-block="image"><img src="/images/example.webp" alt="Example image" /><figcaption>Example caption</figcaption></figure>'
        }
      />,
    );

    expect(screen.getByRole("img", { name: "Example image" })).toHaveAttribute(
      "src",
      "/images/example.webp",
    );
    expect(screen.getByText("Example caption")).toBeInTheDocument();
  });

  it("renders related links blocks inline with optional thumbnails", () => {
    const html = `<section data-sbt-block="related-links" data-image-size="large" data-items="${encodeRelatedLinksItems(
      [
        {
          uid: "link-1",
          kind: "page",
          refId: "page-1",
          href: "/payroll-guide",
          destinationTitle: "Payroll guide",
          label: null,
          imageId: "img-1",
          imageUrl: "/images/payroll-guide.webp",
          imageAlt: "Payroll guide thumbnail",
        },
        {
          uid: "link-2",
          kind: "template",
          refId: "template-1",
          href: "/templates/payroll/checklist",
          destinationTitle: "Payroll checklist",
          label: "Payroll checklist template",
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
    )}"></section>`;

    const { container } = render(<ContentRenderer html={html} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Related to this",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payroll guide" })).toHaveAttribute(
      "href",
      "/payroll-guide",
    );
    expect(
      screen.getByRole("link", { name: "Payroll checklist template" }),
    ).toHaveAttribute("href", "/templates/payroll/checklist");
    expect(
      screen.getByRole("link", { name: "Payroll guide" }),
    ).not.toHaveAttribute("target");
    const renderedImage = container.querySelector(
      '.related-links-block__image[src="/images/payroll-guide.webp"]',
    );
    expect(renderedImage).not.toBeNull();
    expect(renderedImage).toHaveAttribute(
      "sizes",
      "(max-width: 768px) 128px, 144px",
    );
    expect(
      container.querySelectorAll(".related-links-block__media-placeholder"),
    ).toHaveLength(1);
    expect(container.querySelector(".related-links-block")).toHaveClass(
      "related-links-block--image-size-large",
    );
    expect(
      screen.getByRole("link", { name: "Payroll checklist template" }),
    ).not.toHaveClass("related-links-block__link--text-only");
  });

  it("removes the image column entirely when a block has no thumbnails", () => {
    const html = `<section data-sbt-block="related-links" data-items="${encodeRelatedLinksItems(
      [
        {
          uid: "link-1",
          kind: "page",
          refId: "page-1",
          href: "/startup-checklist",
          destinationTitle: "Startup checklist",
          label: null,
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
        {
          uid: "link-2",
          kind: "page",
          refId: "page-2",
          href: "/cash-flow",
          destinationTitle: "Cash flow guide",
          label: null,
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
    )}"></section>`;

    const { container } = render(<ContentRenderer html={html} />);

    expect(container.querySelector(".related-links-block__media")).toBeNull();
    expect(
      container.querySelector(".related-links-block__media-placeholder"),
    ).toBeNull();
    expect(
      container.querySelectorAll(".related-links-block__link--text-only"),
    ).toHaveLength(2);
  });

  it("hides related links blocks that do not contain any valid items", () => {
    const html = `<section data-sbt-block="related-links" data-title="" data-items="${encodeRelatedLinksItems([])}"></section>`;

    render(<ContentRenderer html={html} />);

    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Related to this",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/About SimpleBizToolkit/i)).toBeInTheDocument();
  });

  it("falls back to the first and second anchors when CTA button roles are missing", () => {
    render(
      <ContentRenderer
        html={
          '<section data-sbt-block="cta"><h2>Fallback CTA</h2><p>Two buttons</p><a href="/first">First</a><a href="/second">Second</a></section>'
        }
      />,
    );

    expect(screen.getByRole("link", { name: "First" })).toHaveAttribute(
      "href",
      "/first",
    );
    expect(screen.getByRole("link", { name: "Second" })).toHaveAttribute(
      "href",
      "/second",
    );
  });
});
