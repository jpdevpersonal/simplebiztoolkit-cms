import { beforeEach, describe, expect, it, vi } from "vitest";

const featureFlagsMock = vi.hoisted(() => ({
  showFreeGuideButton: true,
}));

const apiServiceMock = vi.hoisted(() => ({
  getProductCategories: vi.fn(),
}));

const menuContentMocks = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getPublishedMenuItemContent: vi.fn(),
  getMenuItemLandingHref: vi.fn(() => "/pages/articles"),
}));

vi.mock("@/config/featureFlags", () => ({
  featureFlags: featureFlagsMock,
}));

vi.mock("@/config/site", () => ({
  site: {
    url: "https://www.simplebiztoolkit.com",
  },
}));

vi.mock("@/data/featured", () => ({
  featuredProducts: [],
}));

vi.mock("@/lib/api", () => ({
  getApiService: () => apiServiceMock,
}));

vi.mock("@/lib/menuContent", () => menuContentMocks);

vi.mock("@/lib/seo", () => ({
  toAbsoluteUrl: (path: string) => `https://www.simplebiztoolkit.com${path}`,
}));

vi.mock("@/lib/templatesRoute", () => ({
  toTemplatesRoute: (value?: string | null) => value ?? null,
}));

vi.mock("@/lib/slugify", () => ({
  slugify: (value: string) => value.toLowerCase(),
}));

import sitemap from "./sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlagsMock.showFreeGuideButton = true;
    apiServiceMock.getProductCategories.mockResolvedValue({
      data: [],
      statusCode: 200,
    });
    menuContentMocks.getPublishedMenuItems.mockResolvedValue([]);
    menuContentMocks.getPublishedMenuItemContent.mockResolvedValue({
      directPages: [],
      publishedCategories: [],
      totalPages: 0,
    });
  });

  it("includes /free in the sitemap when the guide is enabled", async () => {
    const routes = await sitemap();

    expect(routes.some((route) => route.url.endsWith("/free"))).toBe(true);
  });

  it("omits /free from the sitemap when the guide is disabled", async () => {
    featureFlagsMock.showFreeGuideButton = false;

    const routes = await sitemap();

    expect(routes.some((route) => route.url.endsWith("/free"))).toBe(false);
  });
});
