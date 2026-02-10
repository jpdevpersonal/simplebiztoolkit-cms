"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <>
      <div className="row g-3 mt-2">
        {products.map((p) => (
          <div className="col-md-4" key={p.title}>
            <article className="template-thumbnail sb-card h-100 product-card">
              <div className="overflow-hidden" style={{ width: "100%" }}>
                <Link
                  href={p.productPageUrl || "#"}
                  className="product-thumbnail-clickable"
                  style={{
                    aspectRatio: "3/2",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  <picture
                    style={{
                      position: "relative",
                      width: "95%",
                      height: "100%",
                      display: "block",
                      margin: "0 auto",
                    }}
                  >
                    <Image
                      src={p.image || "/images/placeholder-preview.png"}
                      alt={p.title}
                      className="img-fluid ledger-thumb"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={75}
                      loading="lazy"
                      style={{
                        marginTop: "5px",
                        filter:
                          "drop-shadow(rgba(0, 0, 0, 0.325) 0.5px 2px 3px)",
                      }}
                    />
                  </picture>
                </Link>
              </div>
              <div className="product-card-content">
                <h3 className="product-card-title">{p.title}</h3>
                <h3 className="product-card-problem">{p.problem}</h3>
                <ul className="product-card-bullets">
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <span className="product-card-cta">
                  <span
                    className="sb-btn-icon"
                    style={{ fontSize: "0.9em", fontWeight: "bold" }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle",
                      }}
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
              </div>
            </article>
          </div>
        ))}
      </div>
    </>
  );
}
