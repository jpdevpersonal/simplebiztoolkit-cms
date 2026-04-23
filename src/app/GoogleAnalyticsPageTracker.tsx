"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsPageTrackerProps = {
  measurementId: string;
};

export default function GoogleAnalyticsPageTracker({
  measurementId,
}: GoogleAnalyticsPageTrackerProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsPageTrackerInner measurementId={measurementId} />
    </Suspense>
  );
}

function GoogleAnalyticsPageTrackerInner({
  measurementId,
}: GoogleAnalyticsPageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useRef(false);
  const search = searchParams.toString();

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!measurementId || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname;

    window.gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
      send_to: measurementId,
    });
  }, [measurementId, pathname, search]);

  return null;
}
