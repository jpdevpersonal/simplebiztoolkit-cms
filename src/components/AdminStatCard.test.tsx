import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminStatCard from "./AdminStatCard";

describe("AdminStatCard", () => {
  it("renders label, value, and note", () => {
    render(<AdminStatCard label="Products" value="42" note="This month" />);

    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });

  it("omits note when not provided", () => {
    render(<AdminStatCard label="Drafts" value="3" />);
    expect(screen.queryByText("This month")).not.toBeInTheDocument();
  });

  it("applies lg size class when valueSize is lg", () => {
    const { container } = render(
      <AdminStatCard label="Revenue" value="$500" valueSize="lg" />,
    );
    expect(container.firstChild).toHaveClass("admin-stat-lg");
    // md class should NOT appear on the value element
    const valueEl = container.querySelector(".admin-stat-value");
    expect(valueEl).not.toHaveClass("admin-stat-value-md");
  });
});
