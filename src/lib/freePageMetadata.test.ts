import { describe, expect, it } from "vitest";

import { getFreePageMetadata } from "./freePageMetadata";

describe("getFreePageMetadata", () => {
  it("returns guide metadata when the free guide is enabled", () => {
    const metadata = getFreePageMetadata(true);

    expect(metadata.title).toBe("Free AI Guide");
    expect(metadata.description).toContain("free AI for Small Business guide");
    expect(metadata.alternates?.canonical).toBe("/free");
    expect(metadata.openGraph?.title).toBe(
      "Free AI Guide | Simple Biz Toolkit",
    );
    expect(metadata.openGraph?.url).toBe("/free");
    expect(metadata.twitter?.title).toBe("Free AI Guide | Simple Biz Toolkit");
  });

  it("returns fallback metadata when the free guide is disabled", () => {
    const metadata = getFreePageMetadata(false);

    expect(metadata.title).toBe("Free Templates");
    expect(metadata.description).toContain("not currently available");
    expect(metadata.alternates?.canonical).toBe("/free");
    expect(metadata.openGraph?.title).toBe(
      "Free Templates | Simple Biz Toolkit",
    );
    expect(metadata.openGraph?.url).toBe("/free");
    expect(metadata.twitter?.title).toBe("Free Templates | Simple Biz Toolkit");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
