import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, Callout, ContentFooter, Section } from "./ContentBlocks";

describe("ContentBlocks", () => {
  it("renders Badge, Section, and Callout", () => {
    render(
      <>
        <Badge>New</Badge>
        <Section>Section body</Section>
        <Callout title="Note">Callout body</Callout>
      </>,
    );

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Section body")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText("Callout body")).toBeInTheDocument();
  });

  it("renders ContentFooter text", () => {
    render(<ContentFooter />);
    expect(screen.getByText(/About SimpleBizToolkit/i)).toBeInTheDocument();
  });
});
