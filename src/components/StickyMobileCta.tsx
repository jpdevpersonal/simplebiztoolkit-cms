import Link from "next/link";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import EtsyCtaButton from "@/components/EtsyCtaButton";

export default function StickyMobileCta() {
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
