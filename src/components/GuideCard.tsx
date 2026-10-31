import Image from "next/image";
import Link from "next/link";
import type { MenuItemPage } from "@/lib/api";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import { normalizePublicUrl } from "@/lib/seo";

/** Estimated reading time in minutes (~220 words per minute). */
export function getReadingMinutes(html?: string | null): number | null {
  if (!html) return null;
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return words > 0 ? Math.max(1, Math.round(words / 220)) : null;
}

export function formatGuideDate(dateISO?: string | null): string | null {
  if (!dateISO) return null;
  const parsed = new Date(dateISO);
  if (Number.isNaN(parsed.getTime())) return dateISO;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function GuideCard({
  page,
  featured = false,
  headingLevel = "h2",
}: {
  page: MenuItemPage;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const imageSrc =
    normalizePublicUrl(page.featuredImage) ??
    normalizePublicUrl(page.headerImage);
  const date = formatGuideDate(page.dateISO);
  const minutes = getReadingMinutes(page.content);
  const summary = page.description || page.subtitle;
  const Heading = headingLevel;

  return (
    <Link
      href={`/${page.slug}`}
      className={`sb-content-link sb-guide-card-link${featured ? " is-featured" : ""}`}
      aria-label={`Read ${page.title}`}
    >
      <article className="sb-card sb-guide-card">
        <div className="sb-guide-card-media">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={page.title}
              fill
              sizes={
                featured
                  ? "(max-width: 991px) 100vw, 640px"
                  : "(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 400px"
              }
              loading="lazy"
              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
            />
          ) : (
            <span className="sb-guide-card-placeholder" aria-hidden="true">
              📘
            </span>
          )}
          {featured && <span className="sb-guide-card-badge">Latest guide</span>}
        </div>

        <div className="sb-guide-card-body">
          {(date || minutes) && (
            <p className="sb-guide-card-meta">
              {date && <time dateTime={page.dateISO}>{date}</time>}
              {date && minutes && <span aria-hidden="true">·</span>}
              {minutes && <span>{minutes} min read</span>}
            </p>
          )}
          <Heading className="sb-guide-card-title">{page.title}</Heading>
          {summary && <p className="sb-guide-card-summary">{summary}</p>}
          <span className="sb-guide-card-cta">
            Read guide
            <svg
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
          </span>
        </div>
      </article>
    </Link>
  );
}
