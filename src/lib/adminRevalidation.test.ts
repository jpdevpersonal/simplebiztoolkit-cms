import { describe, expect, it, vi } from "vitest";
import {
  revalidateMenuContent,
  revalidatePageContent,
  revalidateProductContent,
} from "./adminRevalidation";
import { clientApi } from "@/lib/clientApi";

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    revalidateContent: vi.fn(),
  },
}));

describe("adminRevalidation", () => {
  it("revalidates unique product slugs only", async () => {
    await revalidateProductContent("prod-1", "prod-1", "prod-2", " ");

    expect(clientApi.revalidateContent).toHaveBeenCalledTimes(2);
    expect(clientApi.revalidateContent).toHaveBeenNthCalledWith(
      1,
      "product",
      "prod-1",
    );
    expect(clientApi.revalidateContent).toHaveBeenNthCalledWith(
      2,
      "product",
      "prod-2",
    );
  });

  it("revalidates a page with current and previous slugs", async () => {
    await revalidatePageContent("current-page", "old-page");

    expect(clientApi.revalidateContent).toHaveBeenCalledWith(
      "page",
      "current-page",
      "old-page",
    );
  });

  it("revalidates broad menu content", async () => {
    await revalidateMenuContent();

    expect(clientApi.revalidateContent).toHaveBeenCalledWith("page");
  });
});
