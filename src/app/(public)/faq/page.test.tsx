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
    expect(
      screen.getByRole("link", { name: "Help & Troubleshooting" }),
    ).toHaveAttribute("href", "/help");
    expect(screen.getByRole("link", { name: "Etsy Help" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/",
    );
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
