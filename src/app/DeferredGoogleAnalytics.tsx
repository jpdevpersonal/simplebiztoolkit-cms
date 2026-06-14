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
  measurementId: string;
  delayMs?: number;
};

export default function DeferredGoogleAnalytics({
  measurementId,
  delayMs = DEFAULT_GTAG_DELAY_MS,
}: DeferredGoogleAnalyticsProps) {
  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
      window.gtag ??
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

    window.gtag("js", new Date());
    window.gtag("config", measurementId);

    let cancelled = false;
    let delayHandle: number | undefined;
    let idleHandle: number | undefined;
    let removeLoadListener: (() => void) | undefined;

    const injectGtagScript = () => {
      const hasInjectedScript = Array.from(document.scripts).some(
        (script) => script.dataset.deferredGtag === measurementId,
      );

      if (cancelled || hasInjectedScript) {
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
        measurementId,
      )}`;
      script.dataset.deferredGtag = measurementId;
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
  }, [delayMs, measurementId]);

  return null;
}
