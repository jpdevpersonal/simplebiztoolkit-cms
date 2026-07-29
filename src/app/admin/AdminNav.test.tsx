import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import AdminNav from "./AdminNav";

let mockPathname = "/cms";
const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-auth/react", () => ({
  signOut: mockSignOut,
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

  it("groups navigation into clear workspace sections", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Catalog")).toBeInTheDocument();
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

  it("closes the drawer with Escape", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.getElementById("admin-nav-collapse")).not.toHaveClass(
      "is-open",
    );
  });

  it("closes the drawer from the backdrop", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /dismiss navigation/i }),
    );

    expect(document.getElementById("admin-nav-collapse")).not.toHaveClass(
      "is-open",
    );
  });

  it("marks the active nav link based on pathname", () => {
    mockPathname = "/cms/templates";
    render(<AdminNav userEmail="admin@example.com" />);

    const templatesLink = screen.getByText("Templates").closest("a")!;
    expect(templatesLink.className).toContain("active");
    expect(templatesLink).toHaveAttribute("aria-current", "page");

    const dashboardLink = screen.getByText("Dashboard").closest("a")!;
    expect(dashboardLink.className).not.toContain("active");

    // Reset
    mockPathname = "/cms";
  });

  it("marks legacy admin paths active after canonicalization", () => {
    mockPathname = "/admin/pages";
    render(<AdminNav userEmail="admin@example.com" />);

    expect(screen.getByText("Pages").closest("a")!.className).toContain(
      "active",
    );

    mockPathname = "/cms";
  });

  it("renders the sign-out button", () => {
    render(<AdminNav userEmail="admin@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/cms/login" });
  });
});
