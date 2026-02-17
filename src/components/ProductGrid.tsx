"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function ProductGrid({ products }: { products: Product[] }) {
  // Ensure we always show three columns for the Popular Templates
  // section; if there are fewer products, render placeholder cards
  // that match the image aspect and layout.
  const displayItems = [...products];
  while (displayItems.length < 3) displayItems.push(null as unknown as Product);

  return (
    <>
      <div className="row g-3 mt-2">
        {displayItems.map((p, idx) => (
          <div className="col-md-4" key={p ? p.title : `placeholder-${idx}`}>
            <article className="template-thumbnail sb-card h-100 product-card">
              <div className="overflow-hidden" style={{ width: "100%" }}>
                <Link
                  href={p ? p.productPageUrl || "#" : "#"}
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
                    {p ? (
                      <Image
                        src={p.image || "/images/placeholder-preview.png"}
                        alt={p.title}
                        className="img-fluid ledger-thumb"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                        loading="lazy"
                        style={{
                          marginTop: "10px",
                          filter:
                            "drop-shadow(rgba(0, 0, 0, 0.325) 0.5px 2px 3px)",
                        }}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(180deg,#f6f7f8,#ffffff)",
                          borderRadius: 8,
                        }}
                      >
                        <svg
                          width="160"
                          height="106"
                          viewBox="0 0 160 106"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            width="160"
                            height="106"
                            rx="8"
                            fill="#eef1f3"
                          />
                          <g fill="#c7cbd0">
                            <rect x="18" y="26" width="124" height="6" rx="3" />
                            <rect x="18" y="40" width="90" height="6" rx="3" />
                            <rect x="18" y="54" width="60" height="6" rx="3" />
                          </g>
                        </svg>
                      </div>
                    )}
                  </picture>
                </Link>
              </div>
              <div className="product-card-content">
                {p ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h3 className="product-card-title">Coming soon</h3>
                    <p className="sb-muted">New template arriving shortly</p>
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
