"use client";

import { useEffect } from "react";

const DEFAULT_GTAG_DELAY_MS = 1000;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

type DeferredGoogleAnalyticsProps = {
  measurementIds: string[];
  delayMs?: number;
};

export default function DeferredGoogleAnalytics({
  measurementIds,
  delayMs = DEFAULT_GTAG_DELAY_MS,
}: DeferredGoogleAnalyticsProps) {
  useEffect(() => {
    const validIds = measurementIds.filter(Boolean);
    if (validIds.length === 0) return;

    const primaryId = validIds[0];

    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
      window.gtag ??
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

    window.gtag("js", new Date());
    for (const id of validIds) {
      window.gtag("config", id);
    }

    let cancelled = false;
    let delayHandle: number | undefined;
    let idleHandle: number | undefined;
    let removeLoadListener: (() => void) | undefined;

    const injectGtagScript = () => {
      // Only one gtag.js script is needed; key it on the primary ID.
      const hasInjectedScript = Array.from(document.scripts).some(
        (script) => script.dataset.deferredGtag === primaryId,
      );

      if (cancelled || hasInjectedScript) {
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        primaryId,
      )}`;
      script.dataset.deferredGtag = primaryId;
      document.head.appendChild(script);
    };

    const scheduleAfterDelay = () => {
      // If caller requests no delay, inject immediately rather than
      // wait for a timeout or `requestIdleCallback`.
      if (delayMs === 0) {
        injectGtagScript();
        return;
      }

      delayHandle = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleHandle = window.requestIdleCallback(injectGtagScript, {
            timeout: 3000,
          });
          return;
        }

        injectGtagScript();
      }, delayMs);
    };

    if (document.readyState === "complete") {
      scheduleAfterDelay();
    } else {
      window.addEventListener("load", scheduleAfterDelay, { once: true });
      removeLoadListener = () => {
        window.removeEventListener("load", scheduleAfterDelay);
      };
    }

    return () => {
      cancelled = true;
      removeLoadListener?.();
      if (delayHandle !== undefined) window.clearTimeout(delayHandle);
      if (idleHandle !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs, measurementIds.join(",")]);

  return null;
}
