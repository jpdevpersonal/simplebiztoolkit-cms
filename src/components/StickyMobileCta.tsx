"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import EtsyCtaButton from "@/components/EtsyCtaButton";

export default function StickyMobileCta() {
  const pathname = usePathname();

  if (pathname === "/") return null;

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
