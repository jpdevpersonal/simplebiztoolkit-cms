import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FaqAccordion from "./FaqAccordion";

describe("FaqAccordion", () => {
  it("renders FAQ search input and default content", () => {
    render(<FaqAccordion />);
    expect(screen.getByLabelText("Search FAQs")).toBeInTheDocument();
    expect(screen.getByText(/How do I receive my files/i)).toBeInTheDocument();
  });

  it("filters questions based on query", () => {
    render(<FaqAccordion />);

    fireEvent.change(screen.getByLabelText("Search FAQs"), {
      target: { value: "software" },
    });

    expect(
      screen.getByRole("button", { name: /Do I need special/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/How do I receive my files/i),
    ).not.toBeInTheDocument();
  });
});
