import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

vi.mock("@/lib/apiProxy", () => ({ requireAuth: mocks.requireAuth }));

import { POST } from "./route";

describe("POST /api/admin/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests without touching the cache", async () => {
    mocks.requireAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the whole site for signed-in users", async () => {
    mocks.requireAuth.mockResolvedValue({ ok: true, auth: {} });

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.revalidated).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("products");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("faqs");
  });

  it("returns 500 when revalidation throws", async () => {
    mocks.requireAuth.mockResolvedValue({ ok: true, auth: {} });
    mocks.revalidatePath.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST();

    expect(response.status).toBe(500);
  });
});
