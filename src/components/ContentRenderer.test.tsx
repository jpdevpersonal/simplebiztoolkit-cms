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

  it("converts JSX-like tags to data-component HTML", () => {
    const converted = convertArticleToHtml(
      '<Section><p>Hello</p></Section><Callout title="A">B</Callout>',
    );

    expect(converted).toContain('data-component="section"');
    expect(converted).toContain('data-component="callout"');
  });
});
