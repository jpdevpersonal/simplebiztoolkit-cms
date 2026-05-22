import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getApiBaseUrl,
  getApiBaseUrlForBrowser,
  getApiBaseUrlForServer,
  normalizeApiBaseUrl,
} from "./apiBaseUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("apiBaseUrl", () => {
  it("strips a trailing /api segment from configured origins", () => {
    expect(normalizeApiBaseUrl("https://example.com/api")).toBe(
      "https://example.com",
    );
    expect(normalizeApiBaseUrl("https://example.com/api/")).toBe(
      "https://example.com",
    );
  });

  it("strips trailing slashes without changing origins", () => {
    expect(normalizeApiBaseUrl("https://example.com/")).toBe(
      "https://example.com",
    );
  });

  it("normalizes the server base URL from environment variables", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "https://server.example.com/api/");
    vi.stubEnv("INTERNAL_API_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);

    expect(getApiBaseUrlForServer()).toBe("https://server.example.com");
  });

  it("falls back to the public browser URL and normalizes it", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://browser.example.com/api");

    expect(getApiBaseUrlForBrowser()).toBe("https://browser.example.com");
  });

  it("uses the development fallback when no browser URL is configured", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);

    expect(getApiBaseUrlForBrowser()).toBe("http://localhost:5117");
  });

  it("returns an empty string for a blank base URL", () => {
    expect(normalizeApiBaseUrl("   ")).toBe("");
    expect(normalizeApiBaseUrl("")).toBe("");
  });

  it("throws in production when no API URL is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", undefined);
    vi.stubEnv("INTERNAL_API_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);

    expect(() => getApiBaseUrlForServer()).toThrow(
      "Missing API base URL for server builds",
    );
  });

  it("getApiBaseUrl delegates to the server path in a Node.js environment", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);

    // In Node.js (test environment), window is undefined so server path is used
    const url = getApiBaseUrl();
    expect(url).toBe("http://localhost:5117");
  });
});
