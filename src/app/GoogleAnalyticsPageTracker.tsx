"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsPageTrackerProps = {
  measurementIds: string[];
};

export default function GoogleAnalyticsPageTracker({
  measurementIds,
}: GoogleAnalyticsPageTrackerProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsPageTrackerInner measurementIds={measurementIds} />
    </Suspense>
  );
}

function GoogleAnalyticsPageTrackerInner({
  measurementIds,
}: GoogleAnalyticsPageTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useRef(false);
  const search = searchParams.toString();
  const measurementIdsKey = measurementIds.join(",");

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const validIds = measurementIds.filter(Boolean);
    if (validIds.length === 0 || typeof window.gtag !== "function") {
      return;
    }

    const pagePath = search ? `${pathname}?${search}` : pathname;

    for (const id of validIds) {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: pagePath,
        page_title: document.title,
        send_to: id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementIdsKey, pathname, search]);

  return null;
}
