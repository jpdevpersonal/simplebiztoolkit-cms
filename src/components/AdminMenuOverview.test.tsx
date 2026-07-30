import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminMenuOverview from "./AdminMenuOverview";

const menuItems = [
  { id: "menu-1", title: "Guides", status: "published" as const },
  { id: "menu-2", title: "Resources", status: "draft" as const },
];
const categories = [
  {
    id: "topic-1",
    menuItemId: "menu-1",
    title: "Finance",
    status: "published" as const,
    menuItemTitle: "Guides",
    pageCount: 1,
  },
];
const pages = [
  {
    id: "page-1",
    menuItemId: "menu-1",
    slug: "cash-flow",
    title: "Cash flow",
    dateISO: "2026-01-01",
    dateModified: "2026-01-01",
    status: "published" as const,
    menuItemTitle: "Guides",
    categoryTitle: "Finance",
  },
];

describe("AdminMenuOverview", () => {
  it("starts on menu items with counts and edit routes", () => {
    render(
      <AdminMenuOverview
        menuItems={menuItems}
        categories={categories}
        pages={pages}
      />,
    );
    expect(screen.getByRole("tab", { name: /menu items 2/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/cms/menu/menu-1/edit",
    );
  });

  it("switches segments and exposes contextual create actions", () => {
    render(
      <AdminMenuOverview
        menuItems={menuItems}
        categories={categories}
        pages={pages}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: /topics 1/i }));
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new topic/i })).toHaveAttribute(
      "href",
      "/cms/menu/menu-1/categories/new",
    );
    fireEvent.click(screen.getByRole("tab", { name: /menu pages 1/i }));
    expect(screen.getByText("Cash flow")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new page/i })).toHaveAttribute(
      "href",
      "/cms/pages/new",
    );
  });

  it("searches and filters within the active segment", () => {
    render(
      <AdminMenuOverview
        menuItems={menuItems}
        categories={categories}
        pages={pages}
      />,
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search Menu items" }),
      { target: { value: "resources" } },
    );
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.queryByText("Guides")).toBeNull();
    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "published" },
    });
    expect(
      screen.getByText("No menu items match the current search and filters."),
    ).toBeInTheDocument();
  });
});
