import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getFaqsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiService: {
    getFaqs: getFaqsMock,
  },
}));

describe("FAQ page", () => {
  beforeEach(() => {
    vi.resetModules();
    getFaqsMock.mockReset();
  });

  it("renders FAQ heading, accordion, and support links", async () => {
    getFaqsMock.mockResolvedValueOnce({
      data: [
        {
          id: "1",
          q: "How do I receive my files?",
          a: "<p>Instant download via Etsy.</p>",
          group: "Getting started",
          sortOrder: 1,
          status: "published",
        },
      ],
    });

    const { default: FaqPage } = await import("./page");
    render(await FaqPage());

    expect(
      screen.getByRole("heading", { name: "Frequently Asked Questions" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Search FAQs")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Etsy Help/ })).toHaveAttribute(
      "href",
      "https://www.etsy.com/",
    );
    expect(
      screen.getByRole("heading", { name: "Didn't find your answer?" }),
    ).toBeInTheDocument();
  });

  it("shows topic cards and group headings when FAQs span several groups", async () => {
    getFaqsMock.mockResolvedValueOnce({
      data: [
        { id: "1", q: "How do I print?", a: "<p>Print it.</p>", group: "Printing", sortOrder: 1, status: "published" },
        { id: "2", q: "Can I get a refund?", a: "<p>Yes.</p>", group: "Refunds & support", sortOrder: 2, status: "published" },
        { id: "3", q: "Which paper size?", a: "<p>A4.</p>", group: "Printing", sortOrder: 3, status: "published" },
      ],
    });

    const { default: FaqPage } = await import("./page");
    const { container } = render(await FaqPage());

    const topics = screen.getByRole("navigation", { name: "FAQ topics" });
    expect(topics.querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Printing.*2 questions/ })).toHaveAttribute(
      "href",
      "#faq-group-printing",
    );
    expect(container.querySelector("#faq-group-printing")).toHaveTextContent("Printing");
    expect(screen.getByText("3 answers across 2 topics")).toBeInTheDocument();

    // Questions are ordered by group: both printing questions come first.
    const questions = Array.from(
      container.querySelectorAll(".sb-accordion-title"),
    ).map((el) => el.textContent);
    expect(questions).toEqual([
      "How do I print?",
      "Which paper size?",
      "Can I get a refund?",
    ]);
  });

  it("renders an empty state when the API returns no faqs", async () => {
    getFaqsMock.mockResolvedValueOnce({ data: [] });

    const { default: FaqPage } = await import("./page");
    render(await FaqPage());

    expect(
      screen.getByRole("heading", { name: "Frequently Asked Questions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No questions are available right now/i),
    ).toBeInTheDocument();
  });
});
