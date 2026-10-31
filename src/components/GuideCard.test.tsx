import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GuideCard, { getReadingMinutes } from "./GuideCard";

const basePage = {
  id: "g1",
  slug: "guide-a",
  title: "Guide A",
  description: "A helpful guide",
  status: "published",
  dateISO: "2026-03-28",
} as never;

describe("GuideCard", () => {
  it("estimates reading time from HTML content", () => {
    expect(getReadingMinutes(undefined)).toBeNull();
    expect(getReadingMinutes("<p>short</p>")).toBe(1);
    expect(getReadingMinutes(`<p>${"word ".repeat(1100)}</p>`)).toBe(5);
  });

  it("links to the guide and shows date, reading time and summary", () => {
    render(
      <GuideCard
        page={{
          ...(basePage as object),
          content: `<p>${"word ".repeat(660)}</p>`,
          headerImage: "/images/guide.webp",
        } as never}
      />,
    );

    expect(screen.getByRole("link", { name: "Read Guide A" })).toHaveAttribute(
      "href",
      "/guide-a",
    );
    expect(screen.getByText("28 Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("3 min read")).toBeInTheDocument();
    expect(screen.getByText("A helpful guide")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/images/guide.webp");
    expect(screen.queryByText("Latest guide")).not.toBeInTheDocument();
  });

  it("marks the featured guide", () => {
    render(<GuideCard page={basePage} featured />);
    expect(screen.getByText("Latest guide")).toBeInTheDocument();
  });
});
