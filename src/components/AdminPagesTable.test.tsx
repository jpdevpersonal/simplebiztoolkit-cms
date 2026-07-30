import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminPagesTable from "./AdminPagesTable";

const pages = [
  {
    id: "p-2",
    title: "Zebra Page",
    slug: "zebra-page",
    menuItemTitle: "Guides",
    categoryTitle: "Tips",
    status: "draft",
    dateISO: "2024-06-01",
  },
  {
    id: "p-1",
    title: "Apple Page",
    slug: "apple-page",
    menuItemTitle: "Guides",
    categoryTitle: null,
    status: "published",
    dateISO: "2024-01-15",
  },
];

describe("AdminPagesTable", () => {
  it("renders rows and edit links", () => {
    render(<AdminPagesTable pages={pages} />);

    expect(screen.getByText("Apple Page")).toBeTruthy();
    expect(screen.getByText("Zebra Page")).toBeTruthy();

    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks[0]?.getAttribute("href")).toBe("/cms/pages/p-1/edit");
    expect(editLinks[1]?.getAttribute("href")).toBe("/cms/pages/p-2/edit");
  });

  it("sorts by title desc when Title header is clicked", () => {
    const { container } = render(<AdminPagesTable pages={pages} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /title/i }));
    const rows = container.querySelectorAll("tbody tr");
    const firstCell = within(rows[0] as HTMLElement).getAllByRole("cell")[0];
    expect(firstCell?.textContent).toContain("Zebra Page");
  });

  it("sorts by topic asc when Topic header is clicked", () => {
    const { container } = render(<AdminPagesTable pages={pages} />);

    fireEvent.click(screen.getByRole("columnheader", { name: /topic/i }));
    const rows = container.querySelectorAll("tbody tr");
    const firstCell = within(rows[0] as HTMLElement).getAllByRole("cell")[0];
    expect(firstCell?.textContent).toContain("Apple Page");
  });

  it("renders View links to the correct preview target for published and draft pages", () => {
    render(<AdminPagesTable pages={pages} />);

    const viewLinks = screen.getAllByRole("link", { name: /view/i });
    expect(viewLinks[0]?.getAttribute("href")).toBe("/apple-page");
    expect(viewLinks[1]?.getAttribute("href")).toBe("/preview/pages/p-2");
  });

  it("shows empty state when pages is empty", () => {
    render(<AdminPagesTable pages={[]} />);

    expect(
      screen.getByText(/No pages found. Create your first page!/i),
    ).toBeTruthy();
  });

  it("has data-label attributes on all visible cells for mobile card layout", () => {
    const { container } = render(<AdminPagesTable pages={pages} />);

    const firstRow = container.querySelector("tbody tr")!;
    const cells = firstRow.querySelectorAll("td");
    const expectedLabels = [
      "Title",
      "Slug",
      "Menu Item",
      "Topic",
      "Status",
      "Published",
      "Preview",
      "Actions",
    ];

    cells.forEach((cell, i) => {
      expect(cell.getAttribute("data-label")).toBe(expectedLabels[i]);
    });
  });

  it("adds sort-active class to Menu Item, Status, and Published column headers when clicked", () => {
    render(<AdminPagesTable pages={pages} />);

    const menuItemHeader = screen.getByRole("columnheader", {
      name: /menu item/i,
    });
    fireEvent.click(menuItemHeader);
    expect(menuItemHeader).toHaveClass("sort-active");

    const statusHeader = screen.getByRole("columnheader", { name: /status/i });
    fireEvent.click(statusHeader);
    expect(statusHeader).toHaveClass("sort-active");

    const publishedHeader = screen.getByRole("columnheader", {
      name: /published/i,
    });
    fireEvent.click(publishedHeader);
    expect(publishedHeader).toHaveClass("sort-active");
  });

  it("adds sort-active class to Slug column header when clicked", () => {
    render(<AdminPagesTable pages={pages} />);

    const slugHeader = screen.getByRole("columnheader", { name: /slug/i });
    fireEvent.click(slugHeader);
    expect(slugHeader).toHaveClass("sort-active");
  });

  it("searches across page titles and slugs", () => {
    render(<AdminPagesTable pages={pages} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), {
      target: { value: "zebra-page" },
    });

    expect(screen.getByText("Zebra Page")).toBeInTheDocument();
    expect(screen.queryByText("Apple Page")).toBeNull();
    expect(screen.getByText("1 of 2 items")).toBeInTheDocument();
  });

  it("combines status, menu item, and topic filters", () => {
    render(<AdminPagesTable pages={pages} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "draft" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Menu item" }), {
      target: { value: "Guides" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Topic" }), {
      target: { value: "Tips" },
    });

    expect(screen.getByText("Zebra Page")).toBeInTheDocument();
    expect(screen.queryByText("Apple Page")).toBeNull();
  });

  it("shows a filter-specific empty state and clears active controls", () => {
    render(<AdminPagesTable pages={pages} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), {
      target: { value: "missing page" },
    });

    expect(
      screen.getByText("No pages match the current search and filters."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Apple Page")).toBeInTheDocument();
    expect(screen.getByText("Zebra Page")).toBeInTheDocument();
  });
});
