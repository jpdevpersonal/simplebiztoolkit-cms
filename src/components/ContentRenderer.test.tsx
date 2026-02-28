import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ContentRenderer,
  DynamicContentRenderer,
  convertArticleToHtml,
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
    expect(screen.getByText("See all products")).toBeInTheDocument();
  });

  it("converts JSX-like tags to data-component HTML", () => {
    const converted = convertArticleToHtml(
      '<Section><p>Hello</p></Section><Callout title="A">B</Callout><ArticleCTA title="Try" />',
    );

    expect(converted).toContain('data-component="section"');
    expect(converted).toContain('data-component="callout"');
    expect(converted).toContain('data-component="article-cta"');
  });
});
