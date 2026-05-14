import { describe, expect, it, vi } from "vitest";
import { redirectAndRefresh, refreshEditor } from "./adminNavigation";

describe("adminNavigation", () => {
  it("pushes then refreshes when redirecting", () => {
    const router = {
      push: vi.fn(),
      refresh: vi.fn(),
    };

    redirectAndRefresh(router, "/admin/pages");

    expect(router.push).toHaveBeenCalledWith("/cms/pages");
    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes the current editor route", () => {
    const router = {
      refresh: vi.fn(),
    };

    refreshEditor(router);

    expect(router.refresh).toHaveBeenCalledTimes(1);
  });
});
