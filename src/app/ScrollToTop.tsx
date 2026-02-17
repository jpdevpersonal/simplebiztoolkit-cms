"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ensures page always starts at top on navigation
 * Prevents scroll restoration issues
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [pathname]);

  // Also handle initial load
  useEffect(() => {
    // Ensure we're at the top on initial mount
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      // Disable scroll restoration
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    }
  }, []);

  return null;
}
