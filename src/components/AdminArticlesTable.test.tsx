import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Article } from "@/lib/api";
import AdminArticlesTable from "./AdminArticlesTable";

const articles: Article[] = [
  {
    id: "a-2",
    slug: "zebra-guide",
    title: "Zebra Guide",
    subtitle: "",
    description: "",
    content: "",
    dateISO: "2024-06-01",
    category: "Tips",
    readingMinutes: 3,
    status: "draft" as const,
  },
  {
    id: "a-1",
    slug: "apple-intro",
    title: "Apple Intro",
    subtitle: "",
    description: "",
    content: "",
    dateISO: "2024-01-15",
    category: "Guides",
    readingMinutes: 5,
    status: "published" as const,
  },
];

describe("AdminArticlesTable", () => {
  it("renders rows and edit links", () => {
    render(<AdminArticlesTable articles={articles} />);

    expect(screen.getByText("Apple Intro")).toBeInTheDocument();
    expect(screen.getByText("Zebra Guide")).toBeInTheDocument();
    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks.length).toBe(2);
  });

  it("sorts by title asc by default (Alpha first)", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    const rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Apple Intro",
    );
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("sorts by title desc when Title header is clicked", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);
    fireEvent.click(screen.getByRole("columnheader", { name: /title/i }));
    const rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("sorts by slug asc when Slug header is clicked", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /slug/i }));
    const rows = container.querySelectorAll("tbody tr");
    // apple-intro before zebra-guide
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Apple Intro",
    );
  });

  it("sorts by category asc when Category header is clicked", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /category/i }));
    const rows = container.querySelectorAll("tbody tr");
    // Guides before Tips
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Apple Intro",
    );
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("sorts by status asc when Status header is clicked", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /status/i }));
    const rows = container.querySelectorAll("tbody tr");
    // draft before published
    expect(within(rows[0]).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("sorts by published date asc when Published header is clicked", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /published/i }));
    const rows = container.querySelectorAll("tbody tr");
    // 2024-01-15 before 2024-06-01
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Apple Intro",
    );
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("sorts by published date desc on second click", () => {
    const { container } = render(<AdminArticlesTable articles={articles} />);

    const publishedHeader = screen.getByRole("columnheader", {
      name: /published/i,
    });
    fireEvent.click(publishedHeader); // asc
    fireEvent.click(publishedHeader); // desc
    const rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent(
      "Zebra Guide",
    );
  });

  it("shows empty state when articles is empty", () => {
    render(<AdminArticlesTable articles={[]} />);

    expect(
      screen.getByText(/No articles found. Create your first article!/i),
    ).toBeInTheDocument();
  });

  it("renders View links pointing to /blog/{slug}", () => {
    render(<AdminArticlesTable articles={articles} />);

    const viewLinks = screen.getAllByRole("link", { name: /view/i });
    const hrefs = viewLinks.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/blog/apple-intro");
    expect(hrefs).toContain("/blog/zebra-guide");
  });
});
