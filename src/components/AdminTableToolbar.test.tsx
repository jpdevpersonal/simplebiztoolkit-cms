import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminTableToolbar from "./AdminTableToolbar";

const filters = [
  {
    key: "status",
    label: "Status",
    value: "",
    options: [
      { label: "Published", value: "published" },
      { label: "Draft", value: "draft" },
    ],
  },
];

describe("AdminTableToolbar", () => {
  it("reports search and filter changes", () => {
    const onQueryChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <AdminTableToolbar
        query=""
        onQueryChange={onQueryChange}
        searchLabel="Search pages"
        placeholder="Search pages"
        filters={filters}
        onFilterChange={onFilterChange}
        visibleCount={8}
        totalCount={8}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search pages" }), {
      target: { value: "pricing" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "published" },
    });

    expect(onQueryChange).toHaveBeenCalledWith("pricing");
    expect(onFilterChange).toHaveBeenCalledWith("status", "published");
    expect(screen.getByText("8 items")).toBeInTheDocument();
  });

  it("shows a result count and clears active controls", () => {
    const onClear = vi.fn();

    render(
      <AdminTableToolbar
        query="pricing"
        onQueryChange={vi.fn()}
        searchLabel="Search pages"
        placeholder="Search pages"
        filters={filters}
        onFilterChange={vi.fn()}
        visibleCount={2}
        totalCount={8}
        onClear={onClear}
      />,
    );

    expect(screen.getByText("2 of 8 items")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("hides clear when no controls are active", () => {
    render(
      <AdminTableToolbar
        query=""
        onQueryChange={vi.fn()}
        searchLabel="Search pages"
        placeholder="Search pages"
        filters={filters}
        onFilterChange={vi.fn()}
        visibleCount={1}
        totalCount={1}
        onClear={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });
});
