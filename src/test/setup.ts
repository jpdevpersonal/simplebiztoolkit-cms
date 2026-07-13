import React from "react";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Silence noisy React Router v6 future-flag warnings in test output.
// Keep other warnings/errors visible.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const first = args[0];
  const msg = typeof first === "string" ? first : "";
  if (msg.includes("React Router Future Flag Warning")) return;
  originalWarn(...args);
};

// --- Next.js test shims ---
// In Next, <Image> rewrites `src` to /_next/image?... which breaks DOM tests.
// Mock it to a plain <img> that preserves the provided `src`.
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const {
      src,
      alt,
      fill: _fill,
      priority: _priority,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      loader: _loader,
      unoptimized: _unoptimized,
      ...rest
    } = props;

    const resolvedSrc =
      typeof src === "string" ? src : src?.src ? String(src.src) : "";

    return React.createElement("img", {
      ...rest,
      src: resolvedSrc,
      alt: alt ?? "",
    });
  },
}));

// Next <Link> renders an <a> in the DOM; mock for simpler assertions.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => {
    const resolvedHref =
      typeof href === "string" ? href : (href?.pathname ?? "");
    const {
      prefetch: _prefetch,
      replace: _replace,
      scroll: _scroll,
      shallow: _shallow,
      locale: _locale,
      legacyBehavior: _legacyBehavior,
      ...anchorProps
    } = rest;

    return React.createElement(
      "a",
      { href: resolvedHref, ...anchorProps },
      children,
    );
  },
}));

// Mock Next's Script component to a plain <script> so it does not attempt to
// schedule browser-specific loading strategies during unit tests.
vi.mock("next/script", () => ({
  __esModule: true,
  default: ({ children, id, src, strategy }: any) =>
    React.createElement(
      "script",
      {
        "data-testid": id ?? "next-script",
        "data-strategy": strategy,
        src,
      },
      children,
    ),
}));

beforeEach(() => {
  // Force real timers for each test to avoid cross-suite fake timer leaks.
  try {
    if (typeof vi.useRealTimers === "function") vi.useRealTimers();
  } catch {
    // ignore if timers cannot be restored in this environment
  }
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  try {
    if (typeof vi.useRealTimers === "function") vi.useRealTimers();
    if (typeof vi.clearAllTimers === "function") vi.clearAllTimers();
  } catch {
    // ignore if timers cannot be restored
  }

  try {
    cleanup();
  } catch {
    // keep going even if cleanup throws in this environment
  }

  try {
    if (typeof localStorage !== "undefined") localStorage.clear();
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  } catch {
    // ignore when storage APIs are unavailable
  }

  try {
    if (typeof vi.unstubAllGlobals === "function") vi.unstubAllGlobals();
  } catch {
    // ignore if not supported
  }

  try {
    if (typeof vi.restoreAllMocks === "function") vi.restoreAllMocks();
  } catch {
    // ignore if not supported
  }

  try {
    if (typeof vi.clearAllMocks === "function") vi.clearAllMocks();
  } catch {
    // ignore if not supported
  }
});
