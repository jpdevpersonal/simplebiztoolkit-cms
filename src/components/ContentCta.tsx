import Link from "next/link";
import EtsyCtaButton from "@/components/EtsyCtaButton";

interface ContentCtaProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  showEtsyLink?: boolean;
  showHomeLink?: boolean;
  disclosure?: string;
}

export function ContentCta({
  title = "Ready to get started?",
  description = "Get your free guide, then shop securely on Etsy when you're ready.",
  primaryLabel = "",
  primaryHref = "https://www.etsy.com/shop/simplebiztoolkit",
  showEtsyLink = false,
  showHomeLink = false,
  disclosure,
}: ContentCtaProps) {
  return (
    <section className="content-cta">
      <h2>{title}</h2>
      <p className="content-cta-description">{description}</p>

      <div className="content-cta-buttons">
        {primaryLabel && primaryHref && (
          <Link
            href={primaryHref}
            className="content-cta-btn content-cta-btn-primary"
          >
            {primaryLabel}
          </Link>
        )}
        {showHomeLink && (
          <Link
            href="/products"
            className="content-cta-btn content-cta-btn-secondary"
          >
            See all products
          </Link>
        )}

        {showEtsyLink && <EtsyCtaButton />}
      </div>

      {disclosure && <p className="content-cta-disclosure">{disclosure}</p>}
    </section>
  );
}
