import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminNav from "./AdminNav";

let mockPathname = "/admin";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("AdminNav", () => {
  it("renders all navigation links", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
    expect(screen.getByText("Template Categories")).toBeInTheDocument();
    expect(screen.getByText("Menu Manager")).toBeInTheDocument();
    expect(screen.getByText("Menu Items")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
  });

  it("renders the user email", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("renders the burger menu button", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    const burger = screen.getByRole("button", { name: /open menu/i });
    expect(burger).toBeInTheDocument();
    expect(burger).toHaveAttribute("aria-expanded", "false");
    expect(burger).toHaveAttribute("aria-controls", "admin-nav-collapse");
  });

  it("toggles the collapse open when burger is clicked", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    const burger = screen.getByRole("button", { name: /open menu/i });
    const collapse = document.getElementById("admin-nav-collapse")!;

    expect(collapse.className).not.toContain("is-open");

    fireEvent.click(burger);

    expect(collapse.className).toContain("is-open");
    // After opening, the button label changes to "Close menu"
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("toggles the collapse closed on second click", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    const burger = screen.getByRole("button", { name: /open menu/i });
    const collapse = document.getElementById("admin-nav-collapse")!;

    fireEvent.click(burger);
    expect(collapse.className).toContain("is-open");

    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    expect(collapse.className).not.toContain("is-open");
  });

  it("marks the active nav link based on pathname", () => {
    mockPathname = "/admin/templates";
    render(<AdminNav userEmail="admin@example.com" />);

    const templatesLink = screen.getByText("Templates").closest("a")!;
    expect(templatesLink.className).toContain("active");

    const dashboardLink = screen.getByText("Dashboard").closest("a")!;
    expect(dashboardLink.className).not.toContain("active");

    // Reset
    mockPathname = "/admin";
  });

  it("renders the sign-out button", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });
});
