import React from "react";
import { afterEach, vi } from "vitest";
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
    return React.createElement("a", { href: resolvedHref, ...rest }, children);
  },
}));

// Provide a deterministic pathname for components that call `usePathname()`.
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    usePathname: () => "/",
  };
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
