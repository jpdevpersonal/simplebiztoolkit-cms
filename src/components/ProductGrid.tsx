import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import type { Product } from "@/types/product";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import { sanitizeHtml } from "@/lib/sanitize";
import { toTemplatesRoute } from "@/lib/templatesRoute";

export default function ProductGrid({
  products,
  placement = "product_grid",
}: {
  products: Product[];
  placement?: string;
}) {
  return (
    <>
      <div className="row g-3 mt-2">
        {products.map((p, idx) => {
          const href = p ? toTemplatesRoute(p.productPageUrl) || "#" : "#";
          const [, , categorySlug, productSlug] = href.split("/");
          const eventParams = {
            placement,
            destination_type: "template" as const,
            category_slug: categorySlug,
            product_slug: productSlug,
            item_name: p?.title,
          };

          return (
            <div className="col-md-4" key={p ? p.title : `placeholder-${idx}`}>
              <article className="template-thumbnail sb-card h-100 product-card">
                <div className="overflow-hidden product-thumb-wrap">
                  <TrackedLink
                    href={href}
                    className="product-thumbnail-clickable product-thumb-link"
                    eventName="select_item"
                    eventParams={eventParams}
                  >
                    <picture className="product-thumb-picture">
                      {p && (
                        <Image
                          src={p.image || "/images/placeholder-preview.png"}
                          alt={`${p.title} printable template preview`}
                          className="img-fluid ledger-thumb"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={75}
                          loading="lazy"
                          unoptimized={shouldBypassNextImageOptimization(
                            p.image,
                          )}
                        />
                      )}
                    </picture>
                  </TrackedLink>
                </div>
                <div className="product-card-content">
                  {p && (
                    <>
                      <h3 className="product-card-title">
                        <TrackedLink
                          href={href}
                          className="product-card-title-link"
                          eventName="select_item"
                          eventParams={eventParams}
                        >
                          {p.title}
                        </TrackedLink>
                      </h3>
                      {/<[a-z][\s\S]*>/i.test(p.problem ?? "") ? (
                        <div
                          className="product-card-problem"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(p.problem),
                          }}
                        />
                      ) : (
                        <p className="product-card-problem">{p.problem}</p>
                      )}
                      <ul className="product-card-bullets">
                        {p.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                      <TrackedLink
                        href={href}
                        className="product-card-cta product-card-link"
                        eventName="select_item"
                        eventParams={eventParams}
                      >
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
                            aria-hidden="true"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </span>
                        <span>View details</span>
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
                      </TrackedLink>
                    </>
                  )}
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </>
  );
}
