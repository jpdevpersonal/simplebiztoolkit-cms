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
  description = "Browse the available templates and tools, and check each listing for current details.",
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
            href="/templates"
            className="content-cta-btn content-cta-btn-secondary"
          >
            See all templates
          </Link>
        )}

        {showEtsyLink && <EtsyCtaButton />}
      </div>

      {disclosure && <p className="content-cta-disclosure">{disclosure}</p>}
    </section>
  );
}
