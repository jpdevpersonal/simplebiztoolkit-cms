import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Faq } from "@/lib/api";
import AdminFaqsTable from "./AdminFaqsTable";

const faqs: Faq[] = [
  {
    id: "faq-2",
    q: "How do I send an invoice?",
    a: "<p>Open the <strong>invoice template</strong> and add the client.</p>",
    group: "Getting started",
    sortOrder: 2,
    status: "published",
  },
  {
    id: "faq-1",
    q: "Can I change the colours?",
    a: "<p>Yes, every template can be customised.</p>",
    group: "Templates",
    sortOrder: 1,
    status: "draft",
  },
];

describe("AdminFaqsTable", () => {
  it("renders FAQ rows and edit links", () => {
    render(<AdminFaqsTable faqs={faqs} />);

    expect(screen.getByText("How do I send an invoice?")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/cms/faqs/faq-2/edit",
    );
  });

  it("searches sanitized answer text", () => {
    render(<AdminFaqsTable faqs={faqs} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search FAQs" }), {
      target: { value: "invoice template" },
    });

    expect(screen.getByText("How do I send an invoice?")).toBeInTheDocument();
    expect(screen.queryByText("Can I change the colours?")).toBeNull();
  });

  it("combines status and group filters", () => {
    render(<AdminFaqsTable faqs={faqs} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "draft" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Group" }), {
      target: { value: "Templates" },
    });

    expect(screen.getByText("Can I change the colours?")).toBeInTheDocument();
    expect(screen.queryByText("How do I send an invoice?")).toBeNull();
  });

  it("retains sortable order behavior", () => {
    const { container } = render(<AdminFaqsTable faqs={faqs} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /question/i }));
    const firstRow = container.querySelector("tbody tr")!;
    expect(
      within(firstRow).getByText("Can I change the colours?"),
    ).toBeTruthy();
  });

  it("distinguishes no matches from an empty dataset", () => {
    const { rerender } = render(<AdminFaqsTable faqs={faqs} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search FAQs" }), {
      target: { value: "missing" },
    });
    expect(
      screen.getByText("No FAQs match the current search and filters."),
    ).toBeInTheDocument();

    rerender(<AdminFaqsTable faqs={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.getByText("No FAQs found. Create your first FAQ!"),
    ).toBeInTheDocument();
  });
});
