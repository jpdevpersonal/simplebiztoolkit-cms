"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackPublicPageView } from "@/lib/analytics";

const GA_MEASUREMENT_ID = "G-3ZQY64S5JJ";

declare global {
  interface Window {
    __sbtGaInitialized?: boolean;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [scriptReady, setScriptReady] = useState(false);
  const excludedRoute = /^\/(?:admin|cms|api|auth|preview)(?:\/|$)/i.test(
    pathname,
  );

  useEffect(() => {
    if (scriptReady && !excludedRoute) {
      trackPublicPageView(pathname);
    }
  }, [excludedRoute, pathname, scriptReady]);

  if (excludedRoute) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      >
        {`
          if (!window.__sbtGaInitialized) {
            window.__sbtGaInitialized = true;
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          }
        `}
      </Script>
    </>
  );
}
