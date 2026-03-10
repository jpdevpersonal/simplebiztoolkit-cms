import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { sanitizeHtml } from "@/lib/sanitize";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <>
      <div className="row g-3 mt-2">
        {products.map((p, idx) => (
          <div className="col-md-4" key={p ? p.title : `placeholder-${idx}`}>
            <article className="template-thumbnail sb-card h-100 product-card">
              <div className="overflow-hidden product-thumb-wrap">
                <Link
                  href={p ? p.productPageUrl || "#" : "#"}
                  className="product-thumbnail-clickable product-thumb-link"
                >
                  <picture className="product-thumb-picture">
                    {p && (
                      <Image
                        src={p.image || "/images/placeholder-preview.png"}
                        alt={p.title}
                        className="img-fluid ledger-thumb"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                        loading="lazy"
                        style={{ marginTop: "10px" }}
                      />
                    )}
                  </picture>
                </Link>
              </div>
              <div className="product-card-content">
                {p && (
                  <>
                    <h3 className="product-card-title">{p.title}</h3>
                    {/<[a-z][\s\S]*>/i.test(p.problem ?? "") ? (
                      <div
                        className="product-card-problem"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(p.problem),
                        }}
                      />
                    ) : (
                      <h3 className="product-card-problem">{p.problem}</h3>
                    )}
                    <ul className="product-card-bullets">
                      {p.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <span className="product-card-cta">
                      <span className="sb-btn-icon product-cta-icon-wrap">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="product-cta-icon"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </span>
                      <a
                        href={p.productPageUrl || "#"}
                        rel="noopener noreferrer"
                        className="product-card-link"
                      >
                        View details{" "}
                      </a>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 12L12 4M12 4H5M12 4v7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </>
                )}
              </div>
            </article>
          </div>
        ))}
      </div>
    </>
  );
}
