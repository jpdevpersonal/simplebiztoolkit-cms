import { testimonials } from "../data/testimonials";
import Link from "next/link";

type TestimonialGridProps = {
  count?: number;
};

export default function TestimonialGrid({ count }: TestimonialGridProps) {
  const items =
    typeof count === "number" ? testimonials.slice(0, count) : testimonials;

  return (
    <div className="row g-3">
      {items.map((t) => (
        <div className="col-md-4" key={t.id}>
          {t.productLink ? (
            <Link
              href={t.productLink}
              className="text-reset text-decoration-none"
            >
              <blockquote
                className="sb-card p-3 h-100"
                style={{
                  borderLeft: "3px solid var(--sb-brand-blue)",
                  margin: 0,
                }}
              >
                <p
                  style={{
                    fontWeight: 500,
                    fontStyle: "italic",
                    marginBottom: "0.75rem",
                  }}
                >
                  "{t.quote}"
                </p>
                <cite
                  className="sb-muted"
                  style={{ fontSize: "0.8125rem", fontStyle: "normal" }}
                >
                  — {t.name}, {t.role}
                </cite>
              </blockquote>
            </Link>
          ) : (
            <blockquote
              className="sb-card p-3 h-100"
              style={{
                borderLeft: "3px solid var(--sb-brand-blue)",
                margin: 0,
              }}
            >
              <p
                style={{
                  fontWeight: 500,
                  fontStyle: "italic",
                  marginBottom: "0.75rem",
                }}
              >
                "{t.quote}"
              </p>
              <cite
                className="sb-muted"
                style={{ fontSize: "0.8125rem", fontStyle: "normal" }}
              >
                — {t.name}, {t.role}
              </cite>
            </blockquote>
          )}
        </div>
      ))}
    </div>
  );
}
