"use client";

import React, { useMemo, useState } from "react";
import { faqs } from "../data/faqs";

export default function FaqAccordion() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const raw = query || "";
    const q = raw.trim().toLowerCase();
    if (!q) return faqs;

    // remove irrelevant leading phrases from the query
    const stopPhrases = ["how can i", "how do i", "how to", "where can i"];
    let cleaned = q;
    stopPhrases.forEach((p) => {
      cleaned = cleaned.replace(new RegExp(p, "g"), " ");
    });

    // extract word tokens (ignore single-letter tokens)
    const tokens = (cleaned.match(/\b\w+\b/g) || [])
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 1);
    if (tokens.length === 0) return faqs;

    // match only whole words using word-boundary regex for each token
    return faqs.filter((f) => {
      const question = f.q?.toLowerCase() || "";
      const answer = f.a?.toLowerCase() || "";
      return tokens.some((t) => {
        const re = new RegExp(
          `\\b${t.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`,
          "i",
        );
        return re.test(question) || re.test(answer);
      });
    });
  }, [query]);

  // prepare tokens and regex for highlighting
  const highlightRegex = useMemo(() => {
    const raw = query || "";
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    const stopPhrases = ["how can i", "how do i", "how to", "where can i"];
    let cleaned = q;
    stopPhrases.forEach((p) => {
      cleaned = cleaned.replace(new RegExp(p, "g"), " ");
    });
    const tokens = (cleaned.match(/\b\w+\b/g) || [])
      .map((t) => t.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"))
      .filter((t) => t.length > 1);
    if (tokens.length === 0) return null;
    // match whole words only
    return new RegExp(`\\b(${tokens.join("|")})\\b`, "gi");
  }, [query]);

  const highlightText = (text: string, isHeader = false) => {
    if (!highlightRegex || !text) return text;
    // split by the capture group so matches are preserved in the array
    const parts = text.split(highlightRegex);
    const testRe = new RegExp(highlightRegex.source, "i");
    return parts.map((part, i) => {
      if (testRe.test(part)) {
        const cls = isHeader
          ? "sb-highlight sb-highlight-header"
          : "sb-highlight sb-highlight-body";
        return (
          <mark key={i} className={cls}>
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="card" style={{ border: "1px solid var(--sb-border)" }}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <p className="sb-muted mb-0">
              Answers to common questions about downloads and usage.
            </p>
          </div>
        </div>

        <div className="mb-3 sb-search">
          <svg className="sb-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <input
            type="search"
            className="form-control"
            placeholder="Search questions and answers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search FAQs"
          />
        </div>

        <div className="accordion sb-accordion" id="faqAcc">
          {items.length === 0 && (
            <div className="alert alert-info">
              No questions match your search.
            </div>
          )}

          {items.map((f, idx) => {
            const id = `faq-${idx}`;
            // when searching, expand matched items so answers are visible even if collapsed
            const q = query.trim().toLowerCase();
            const searching = q.length > 0;
            const shouldExpand = searching ? true : idx === 0;

            return (
              <div className="accordion-item" key={id}>
                <h2 className="accordion-header" id={`${id}-header`}>
                  <button
                    className={`accordion-button ${shouldExpand ? "" : "collapsed"} sb-accordion-button`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#${id}`}
                    aria-expanded={shouldExpand ? "true" : "false"}
                    aria-controls={id}
                  >
                    <span className="sb-accordion-title">
                      {highlightText(String(f.q), true)}
                    </span>
                  </button>
                </h2>
                <div
                  id={id}
                  className={`accordion-collapse collapse ${shouldExpand ? "show" : ""}`}
                  data-bs-parent="#faqAcc"
                >
                  <div className="accordion-body sb-muted">
                    {highlightText(String(f.a), false)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
