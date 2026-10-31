import type { Metadata } from "next";
import Link from "next/link";

import EtsyCtaButton from "@/components/EtsyCtaButton";
import JsonLd from "@/components/JsonLd";
import { HeroChips, PageHero } from "@/components/PageHero";
import ProductGrid from "@/components/ProductGrid";
import TrackedLink from "@/components/TrackedLink";
import { featuredProducts } from "@/data/featured";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { getPublicVisibleStats } from "@/lib/publicStats";
import { createBreadcrumbJsonLd } from "@/lib/seo";
import { getStarSellerLabel } from "@/lib/stats";
import { toTemplatesRoute } from "@/lib/templatesRoute";
import "@/styles/products.css";
import "@/styles/reviews.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Customer Reviews & Testimonials",
  description:
    "Read selected customer feedback about Simple Biz Toolkit and browse the templates available on Etsy.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Customer Reviews & Testimonials | Simple Biz Toolkit",
    description:
      "Read selected customer feedback about Simple Biz Toolkit and browse the templates available on Etsy.",
    url: "/testimonials",
  },
};

type Review = {
  id: number;
  stars: number;
  quote: string;
  name: string;
  role: string;
  href?: string;
  templateName?: string;
  categorySlug?: string;
  productSlug?: string;
};

function toReview(t: Testimonial): Review {
  const href = toTemplatesRoute(t.productLink);
  const [, , categorySlug, productSlug] = href?.split("/") ?? [];
  const templateName = categorySlug
    ? categorySlug.charAt(0).toUpperCase() +
      categorySlug.slice(1).replace(/-/g, " ")
    : undefined;

  return {
    id: t.id,
    stars: [...(t.quote.match(/^[⭐★]+/)?.[0] ?? "⭐⭐⭐⭐⭐")].length,
    quote: t.quote.replace(/^[⭐★\s.]+/, "").trim(),
    name: t.name,
    role: t.role,
    href,
    templateName,
    categorySlug,
    productSlug,
  };
}

function Stars({ count, label }: { count: number; label?: string }) {
  return (
    <span
      className="sb-review-stars"
      role="img"
      aria-label={label ?? `${count} out of 5 stars`}
    >
      {"★".repeat(count)}
    </span>
  );
}

/** Five stars, filled proportionally to the rating (e.g. 4.8 → 96%). */
function RatingStars({ rating }: { rating: number }) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className="sb-rating-stars"
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      <span className="sb-rating-stars-base" aria-hidden="true">
        ★★★★★
      </span>
      <span
        className="sb-rating-stars-fill"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      >
        ★★★★★
      </span>
    </span>
  );
}

function TemplateLink({
  review,
  placement,
  className = "sb-review-template",
}: {
  review: Review;
  placement: string;
  className?: string;
}) {
  if (!review.href || !review.templateName) return null;

  return (
    <TrackedLink
      href={review.href}
      className={className}
      eventName="select_item"
      eventParams={{
        placement,
        destination_type: "template",
        category_slug: review.categorySlug,
        product_slug: review.productSlug,
        item_name: review.templateName,
      }}
    >
      <span className="sb-review-template-label">Reviewed</span>
      <span className="sb-review-template-name">{review.templateName}</span>
      <span className="sb-review-template-cta">
        View template
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </TrackedLink>
  );
}

function Author({ review }: { review: Review }) {
  return (
    <div className="sb-review-author">
      <span className="sb-review-avatar" aria-hidden="true">
        {review.name.charAt(0).toUpperCase()}
      </span>
      <div>
        <cite className="sb-review-name">{review.name}</cite>
        <span className="sb-review-role">
          {review.role} · <span className="sb-review-source">Etsy review</span>
        </span>
      </div>
    </div>
  );
}

const reassurances = [
  {
    title: "Instant digital download",
    copy: "Buyers mention fast, easy PDF downloads – start using your template the same day.",
    icon: "M12 3v12m0 0-4-4m4 4 4-4M5 21h14",
  },
  {
    title: "Simple to fill in",
    copy: "Clean, ready-made layouts you can print or complete yourself, without a learning curve.",
    icon: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  },
  {
    title: "Secure checkout via Etsy",
    copy: "Purchases are completed on Etsy, so you check out with a marketplace you already know.",
    icon: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Zm-3 9 2 2 4-4",
  },
];

export default async function TestimonialsPage() {
  const stats = await getPublicVisibleStats();
  const starSellerLabel = getStarSellerLabel(stats["star-seller"]);
  const ratingValue = stats.rating ? Number.parseFloat(stats.rating) : NaN;
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;

  const reviews = testimonials.map(toReview);
  const featured = reviews.reduce((longest, review) =>
    review.quote.length > longest.quote.length ? review : longest,
  );
  const others = reviews.filter((review) => review.id !== featured.id);

  const highlights: string[] = [];
  if (stats.reviews) highlights.push(`${stats.reviews} reviews`);
  if (stats.sales) highlights.push(`${stats.sales} sales`);
  if (starSellerLabel) highlights.push(starSellerLabel);

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Reviews", href: "/testimonials" },
  ]);

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />

      {/* ====== HERO + RATING SUMMARY + FEATURED REVIEW ====== */}
      <section className="sb-section sb-reviews-featured-section">
        <div className="container">
          <PageHero
            badge="⭐"
            eyebrow="Etsy feedback"
            title="Customer reviews"
            intro={
              <p className="sb-speakable">
                Selected feedback about Simple Biz Toolkit templates from buyers
                – small business owners, landlords and Etsy sellers who wanted a
                simpler way to stay organised.
              </p>
            }
          >
            <div
              className="sb-reviews-summary"
              role="group"
              aria-label="Customer rating summary"
            >
              {hasRating ? (
                <>
                  <div className="sb-reviews-summary-score">
                    {stats.rating}
                    <span>/ 5</span>
                  </div>
                  <div>
                    <RatingStars rating={ratingValue} />
                    <p className="sb-reviews-summary-caption">
                      Average Etsy rating
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <Stars count={5} label="Customer reviews" />
                  <p className="sb-reviews-summary-caption">
                    Loved by small business owners
                  </p>
                </div>
              )}
            </div>
            {highlights.length > 0 && (
              <HeroChips items={highlights} label="Shop highlights" />
            )}
            <div className="sb-reviews-hero-actions">
              <Link href="/templates" className="btn sb-btn-primary">
                Browse all templates
                <svg
                  className="sb-btn-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <EtsyCtaButton
                label="Visit our Etsy shop"
                className="sb-reviews-etsy-link"
                hideOnHome={false}
                analyticsPlacement="reviews_hero"
              />
            </div>
          </PageHero>

          <figure className="sb-review-featured">
            <span className="sb-review-featured-mark" aria-hidden="true">
              &ldquo;
            </span>
            <Stars count={featured.stars} />
            <blockquote className="sb-review-featured-quote">
              <p>{featured.quote}</p>
            </blockquote>
            <figcaption className="sb-review-featured-footer">
              <Author review={featured} />
              <TemplateLink
                review={featured}
                placement="reviews_featured"
                className="sb-review-template sb-review-template-featured"
              />
            </figcaption>
          </figure>

          {/* ====== ALL REVIEWS ====== */}
          <div className="sb-section-header sb-reviews-list-header">
            <h2>What buyers are saying</h2>
            <p>Each review links to the template that customer bought.</p>
          </div>

          <div className="sb-reviews-masonry">
            {others.map((review) => (
              <figure className="sb-review-card" key={review.id}>
                <Stars count={review.stars} />
                <blockquote className="sb-review-quote">
                  <p>&ldquo;{review.quote}&rdquo;</p>
                </blockquote>
                <figcaption>
                  <Author review={review} />
                  <TemplateLink review={review} placement="reviews_card" />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ====== REASSURANCE ====== */}
      <section className="sb-section sb-section-alt sb-reviews-reassure">
        <div className="container">
          <div className="sb-reviews-reassure-grid">
            {reassurances.map((item) => (
              <div className="sb-reviews-reassure-item" key={item.title}>
                <span className="sb-reviews-reassure-icon" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== POPULAR TEMPLATES ====== */}
      <section className="sb-section sb-products-section">
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">Best sellers</span>
            <h2>Popular templates with our customers</h2>
            <p>Start with the templates other buyers pick most often.</p>
          </div>
          <ProductGrid
            products={featuredProducts}
            placement="reviews_popular_templates"
          />
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="sb-reviews-cta">
        <div className="container">
          <div className="sb-reviews-cta-panel">
            <div>
              <h2>Ready to get your paperwork sorted?</h2>
              <p>
                Find the template that fits your business and download it in
                minutes.
              </p>
            </div>
            <div className="sb-reviews-cta-actions">
              <Link href="/templates" className="btn sb-reviews-cta-primary">
                Browse all templates
              </Link>
              <EtsyCtaButton
                label="Shop on Etsy"
                className="sb-reviews-cta-secondary"
                hideOnHome={false}
                analyticsPlacement="reviews_footer_cta"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
