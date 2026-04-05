import { testimonials } from "../data/testimonials";
import Link from "next/link";
import { toTemplatesRoute } from "@/lib/templatesRoute";

type TestimonialGridProps = {
  count?: number;
};

function StarRating() {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
        marginBottom: "0.75rem",
        color: "#f59e0b",
        fontSize: "0.875rem",
      }}
      aria-label="5 star rating"
    >
      {"★★★★★".split("").map((star, i) => (
        <span key={i}>{star}</span>
      ))}
    </div>
  );
}

function AuthorInitial({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #414556, #2d3039)",
        color: "#fff",
        fontSize: "0.8125rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

export default function TestimonialGrid({ count }: TestimonialGridProps) {
  const items =
    typeof count === "number" ? testimonials.slice(0, count) : testimonials;

  const card = (t: (typeof testimonials)[0]) => (
    <blockquote
      className="sb-card p-4 h-100"
      style={{
        margin: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(135deg, var(--sb-green), var(--sb-brand-blue))",
        }}
        aria-hidden="true"
      />
      <StarRating />
      <p
        style={{
          fontWeight: 500,
          fontStyle: "italic",
          marginBottom: "auto",
          paddingBottom: "1rem",
          fontSize: "0.9375rem",
          lineHeight: 1.65,
          color: "var(--sb-ink)",
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--sb-border)",
        }}
      >
        <AuthorInitial name={t.name} />
        <div>
          <cite
            style={{
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--sb-ink)",
              display: "block",
            }}
          >
            {t.name}
          </cite>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--sb-muted)",
            }}
          >
            {t.role}
          </span>
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
