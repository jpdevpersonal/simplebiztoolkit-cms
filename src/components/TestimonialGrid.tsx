import { testimonials } from "../data/testimonials";
import Link from "next/link";
import { toTemplatesRoute } from "@/lib/templatesRoute";

type TestimonialGridProps = {
  count?: number;
};

function StarRating({ stars }: { stars: string }) {
  return (
    <div
      className="sb-testimonial-rating"
      aria-label={`${stars.length} star rating`}
    >
      {stars.split("").map((star, i) => (
        <span key={i} aria-hidden="true">
          {star}
        </span>
      ))}
    </div>
  );
}

function AuthorInitial({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span className="sb-testimonial-avatar" aria-hidden="true">
      {initial}
    </span>
  );
}

export default function TestimonialGrid({ count }: TestimonialGridProps) {
  const items =
    typeof count === "number" ? testimonials.slice(0, count) : testimonials;

  const card = (t: (typeof testimonials)[0]) => (
    <blockquote className="sb-card sb-testimonial-card h-100">
      <StarRating stars={t.quote.match(/^[⭐★]+/)?.[0] ?? "⭐⭐⭐⭐⭐"} />
      <p className="sb-testimonial-quote">
        &ldquo;{t.quote.replace(/^[⭐★\s]+/, "")}&rdquo;
      </p>
      <div className="sb-testimonial-author">
        <AuthorInitial name={t.name} />
        <div>
          <cite className="sb-testimonial-name">{t.name}</cite>
          <span className="sb-testimonial-role">{t.role}</span>
        </div>
      </div>
    </blockquote>
  );

  return (
    <div className="row g-3">
      {items.map((t) => {
        const productHref = toTemplatesRoute(t.productLink);

        return (
          <div className="col-md-4" key={t.id}>
            {productHref ? (
              <Link
                href={productHref}
                className="text-reset text-decoration-none"
              >
                {card(t)}
              </Link>
            ) : (
              card(t)
            )}
          </div>
        );
      })}
    </div>
  );
}
