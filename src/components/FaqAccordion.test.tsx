import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FaqAccordion from "./FaqAccordion";
import type { Faq } from "@/lib/api";

const sampleFaqs: Faq[] = [
  {
    id: "1",
    q: "How do I receive my files?",
    a: "<p>Instant digital download via Etsy.</p>",
    group: "Getting started",
    sortOrder: 1,
    status: "published",
  },
  {
    id: "2",
    q: "Do I need special software?",
    a: "<p>No. Any standard PDF reader works.</p>",
    group: "File formats & software",
    sortOrder: 1,
    status: "published",
  },
];

describe("FaqAccordion", () => {
  it("renders FAQ search input and supplied questions", () => {
    render(<FaqAccordion faqs={sampleFaqs} />);
    expect(screen.getByLabelText("Search FAQs")).toBeInTheDocument();
    expect(screen.getByText(/How do I receive my files/i)).toBeInTheDocument();
  });

  it("filters questions based on query", () => {
    render(<FaqAccordion faqs={sampleFaqs} />);

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

  it("renders an empty state when no faqs are supplied", () => {
    render(<FaqAccordion />);
    expect(
      screen.getByText(/No questions are available right now/i),
    ).toBeInTheDocument();
  });
});
