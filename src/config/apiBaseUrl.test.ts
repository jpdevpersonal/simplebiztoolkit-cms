import { afterEach, describe, expect, it } from "vitest";
import {
  getApiBaseUrlForBrowser,
  getApiBaseUrlForServer,
  normalizeApiBaseUrl,
} from "./apiBaseUrl";

const originalEnv = {
  API_URL: process.env.API_URL,
  INTERNAL_API_URL: process.env.INTERNAL_API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  restoreEnv();
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
    process.env.NODE_ENV = "production";
    process.env.API_URL = "https://server.example.com/api/";
    delete process.env.INTERNAL_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiBaseUrlForServer()).toBe("https://server.example.com");
  });

  it("falls back to the public browser URL and normalizes it", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://browser.example.com/api";

    expect(getApiBaseUrlForBrowser()).toBe("https://browser.example.com");
  });

  it("uses the development fallback when no browser URL is configured", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiBaseUrlForBrowser()).toBe("http://localhost:5117");
  });
});
