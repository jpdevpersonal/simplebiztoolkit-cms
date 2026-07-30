import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProductCategory } from "@/lib/api";
import AdminCategoriesTable from "./AdminCategoriesTable";

const categories: ProductCategory[] = [
  {
    id: "cat-1",
    name: "Business planning",
    slug: "business-planning",
    summary: "",
    howThisHelps: "",
    heroImage: "",
    items: [],
  },
  {
    id: "cat-2",
    name: "Cash flow",
    slug: "cash-flow",
    summary: "",
    howThisHelps: "",
    heroImage: "",
    items: [],
  },
];

describe("AdminCategoriesTable", () => {
  it("renders category routes and mobile labels", () => {
    const { container } = render(
      <AdminCategoriesTable categories={categories} />,
    );

    expect(screen.getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/cms/categories/cat-1/edit",
    );
    expect(screen.getAllByRole("link", { name: /view/i })[0]).toHaveAttribute(
      "href",
      "/templates/business-planning",
    );
    expect(
      Array.from(container.querySelectorAll("tbody tr:first-child td")).map(
        (cell) => cell.getAttribute("data-label"),
      ),
    ).toEqual(["Name", "Slug", "Templates", "Preview", "Actions"]);
  });

  it("searches names and slugs and can clear the search", () => {
    render(<AdminCategoriesTable categories={categories} />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search template categories" }),
      { target: { value: "cash-flow" } },
    );
    expect(screen.getByText("Cash flow")).toBeInTheDocument();
    expect(screen.queryByText("Business planning")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Business planning")).toBeInTheDocument();
  });

  it("distinguishes an empty list from no search matches", () => {
    const { rerender } = render(
      <AdminCategoriesTable categories={categories} />,
    );
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search template categories" }),
      { target: { value: "missing" } },
    );
    expect(screen.getByText("No categories match your search.")).toBeTruthy();

    rerender(<AdminCategoriesTable categories={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.getByText("No categories found. Create your first category!"),
    ).toBeTruthy();
  });
});
