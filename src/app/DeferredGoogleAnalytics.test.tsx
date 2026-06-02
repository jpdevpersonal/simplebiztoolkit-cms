import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DeferredGoogleAnalytics from "./DeferredGoogleAnalytics";

const measurementId = "G-TEST123";

function getDeferredGtagScripts() {
  return Array.from(document.scripts).filter(
    (script) => script.dataset.deferredGtag === measurementId,
  );
}

afterEach(() => {
  getDeferredGtagScripts().forEach((script) => script.remove());
  delete window.dataLayer;
  delete window.gtag;
});

describe("DeferredGoogleAnalytics", () => {
  it("queues the initial GA config without immediately injecting gtag.js", () => {
    const { unmount } = render(
      <DeferredGoogleAnalytics measurementId={measurementId} delayMs={50} />,
    );

    expect(window.gtag).toBeTypeOf("function");
    expect(window.dataLayer).toEqual([
      ["js", expect.any(Date)],
      ["config", measurementId],
    ]);
    expect(getDeferredGtagScripts()).toHaveLength(0);

    unmount();
  });

  it("injects gtag.js after load and the configured delay", async () => {
    render(
      <DeferredGoogleAnalytics measurementId={measurementId} delayMs={0} />,
    );

    window.dispatchEvent(new Event("load"));

    await waitFor(() => {
      expect(getDeferredGtagScripts()).toHaveLength(1);
    });

    const [script] = getDeferredGtagScripts();
    expect(script.async).toBe(true);
    expect(script.src).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    );
  });
});
