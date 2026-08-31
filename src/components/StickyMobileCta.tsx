"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import EtsyCtaButton from "@/components/EtsyCtaButton";

// Roughly one viewport: keeps the bar off the hero on first paint.
const HOME_REVEAL_OFFSET_PX = 700;

export default function StickyMobileCta() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const update = () => setPastHero(window.scrollY > HOME_REVEAL_OFFSET_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);

  if (isHome) {
    if (!pastHero) return null;

    return (
      <div className="sb-sticky-cta">
        <div className="container d-flex gap-2 justify-content-center">
          <Link className="btn sb-btn-primary" href="/templates">
            Browse Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-sticky-cta">
      <div className="container d-flex gap-2 justify-content-center">
        <EtsyCtaButton />
        {featureFlags.showFreeGuideButton && (
          <Link className="btn sb-btn-ghost" href={links.freebiePath}>
            Get your free guide
          </Link>
        )}
      </div>
    </div>
  );
}
