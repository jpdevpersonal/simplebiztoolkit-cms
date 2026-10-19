"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import TrackedLink from "@/components/TrackedLink";

// Roughly one viewport: keeps the bar off the hero on first paint.
const HOME_REVEAL_OFFSET_PX = 700;

export default function StickyMobileCta() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";
  const isProductDetail = /^\/templates\/[^/]+\/[^/]+\/?$/.test(pathname);
  const isTemplatePreview = pathname.startsWith("/preview/templates/");
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const update = () => setPastHero(window.scrollY > HOME_REVEAL_OFFSET_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);

  if (isProductDetail || isTemplatePreview) return null;

  if (isHome) {
    if (!pastHero) return null;

    return (
      <div className="sb-sticky-cta">
        <div className="container d-flex gap-2 justify-content-center">
          <TrackedLink
            className="btn sb-btn-primary"
            href="/templates"
            eventName="cta_click"
            eventParams={{
              placement: "homepage_sticky",
              destination_type: "template_category",
            }}
          >
            Browse Templates
          </TrackedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-sticky-cta">
      <div className="container d-flex gap-2 justify-content-center">
        <EtsyCtaButton analyticsPlacement="sticky_general" />
        {featureFlags.showFreeGuideButton && (
          <Link className="btn sb-btn-ghost" href={links.freebiePath}>
            Get your free guide
          </Link>
        )}
      </div>
    </div>
  );
}
