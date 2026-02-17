import { describe, it, expect, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => authMocks);

import * as route from "./route";

describe("/api/auth/[...nextauth] route exports", () => {
  it("re-exports GET and POST handlers from auth config", () => {
    expect(route.GET).toBe(authMocks.handlers.GET);
    expect(route.POST).toBe(authMocks.handlers.POST);
  });
});
