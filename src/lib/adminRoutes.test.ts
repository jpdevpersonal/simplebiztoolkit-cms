import { describe, expect, it } from "vitest";
import {
  CMS_HOME_PATH,
  getSafeCmsCallbackUrl,
  isCmsPath,
  isLegacyAdminPath,
  toCmsPath,
  toLegacyAdminPath,
} from "./adminRoutes";

describe("adminRoutes", () => {
  it("canonicalizes legacy admin paths to CMS paths", () => {
    expect(toCmsPath("/admin")).toBe("/cms");
    expect(toCmsPath("/admin/pages/p-1/edit?tab=seo#top")).toBe(
      "/cms/pages/p-1/edit?tab=seo#top",
    );
    expect(toCmsPath("/api/admin/images")).toBe("/api/admin/images");
  });

  it("rewrites CMS paths back to the internal admin route tree", () => {
    expect(toLegacyAdminPath("/cms")).toBe("/admin");
    expect(toLegacyAdminPath("/cms/menu-manager?menuKey=footer")).toBe(
      "/admin/menu-manager?menuKey=footer",
    );
  });

  it("recognizes only route-tree admin and CMS paths", () => {
    expect(isCmsPath("/cms/pages")).toBe(true);
    expect(isCmsPath("/cms-tools")).toBe(false);
    expect(isLegacyAdminPath("/admin/menu")).toBe(true);
    expect(isLegacyAdminPath("/api/admin/images")).toBe(false);
  });

  it("allows only same-origin CMS callback URLs", () => {
    expect(
      getSafeCmsCallbackUrl("/cms/pages?status=draft", "https://example.com"),
    ).toBe("/cms/pages?status=draft");
    expect(getSafeCmsCallbackUrl("/admin/pages", "https://example.com")).toBe(
      "/cms/pages",
    );
    expect(
      getSafeCmsCallbackUrl(
        "https://evil.example/cms/pages",
        "https://example.com",
      ),
    ).toBe(CMS_HOME_PATH);
    expect(
      getSafeCmsCallbackUrl("//evil.example/cms/pages", "https://example.com"),
    ).toBe(CMS_HOME_PATH);
    expect(getSafeCmsCallbackUrl("/templates", "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
    expect(getSafeCmsCallbackUrl("/cms/login", "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
  });

  it("canonicalizes admin paths with query strings to CMS paths", () => {
    expect(toCmsPath("/admin?redirect=1")).toBe("/cms?redirect=1");
    expect(toCmsPath("/admin#section")).toBe("/cms#section");
  });

  it("rewrites CMS paths with query strings back to admin routes", () => {
    expect(toLegacyAdminPath("/cms?tab=seo")).toBe("/admin?tab=seo");
    expect(toLegacyAdminPath("/cms#top")).toBe("/admin#top");
  });

  it("returns the CMS home path for malformed callback URLs", () => {
    // An invalid URL that can't be parsed at all
    expect(getSafeCmsCallbackUrl("://bad-url", "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
  });

  it("returns CMS home path when callback URL is null or empty", () => {
    expect(getSafeCmsCallbackUrl(null, "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
    expect(getSafeCmsCallbackUrl("", "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
    expect(getSafeCmsCallbackUrl("   ", "https://example.com")).toBe(
      CMS_HOME_PATH,
    );
  });
});
