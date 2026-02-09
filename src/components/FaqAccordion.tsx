"use client";

import React, { useMemo, useState } from "react";
import { faqs } from "../data/faqs";

export default function FaqAccordion() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.q.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="card" style={{ border: "1px solid var(--sb-border)" }}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h2 className="h5" style={{ fontWeight: 800 }}>
              Frequently asked questions
            </h2>
            <p className="sb-muted mb-0">
              Common questions about downloads and usage.
            </p>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="search"
            className="form-control"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search FAQs"
          />
        </div>

        <div className="accordion" id="faqAcc">
          {items.length === 0 && (
            <div className="alert alert-info">
              No questions match your search.
            </div>
          )}

          {items.map((f, idx) => {
            const id = `faq-${idx}`;
            return (
              <div className="accordion-item" key={id}>
                <h2 className="accordion-header" id={`${id}-header`}>
                  <button
                    className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${id}`}
                    aria-expanded={idx === 0 ? "true" : "false"}
                    aria-controls={id}
                    style={{
                      fontWeight: 700,
                      color: "white",
                      backgroundColor: "var(--sb-brand-blue)",
                    }}
                  >
                    {f.q}
                  </button>
                </h2>
                <div
                  id={id}
                  className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`}
                  data-bs-parent="#faqAcc"
                >
                  <div className="accordion-body sb-muted">{f.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
