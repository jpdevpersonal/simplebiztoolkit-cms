import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FaqPage from "./page";

describe("FAQ page", () => {
  it("renders FAQ heading, accordion, and support links", () => {
    render(<FaqPage />);

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
});
