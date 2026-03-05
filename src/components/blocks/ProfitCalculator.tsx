"use client";

/**
 * ProfitCalculator – example custom CMS block component.
 *
 * Registered in BlockRenderer under the key "profit-calculator".
 * Renders when BlockRenderer encounters:
 *   <div data-sbt-block="profit-calculator"></div>
 *
 * Replace the placeholder body with real calculator logic as needed.
 */

import { useState } from "react";

export default function ProfitCalculator() {
  const [revenue, setRevenue] = useState("");
  const [costs, setCosts] = useState("");

  const revenueNum = parseFloat(revenue) || 0;
  const costsNum = parseFloat(costs) || 0;
  const profit = revenueNum - costsNum;
  const margin =
    revenueNum > 0 ? ((profit / revenueNum) * 100).toFixed(1) : "—";

  return (
    <div
      data-sbt-block="profit-calculator"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "20px 24px",
        background: "#f9fafb",
        margin: "16px 0",
        maxWidth: 480,
      }}
    >
      <h3
        style={{
          margin: "0 0 16px",
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Profit Calculator
      </h3>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label style={{ display: "grid", gap: 4, fontSize: "0.875rem" }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>Revenue ($)</span>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            placeholder="e.g. 5000"
            min="0"
            step="0.01"
            style={{
              padding: "6px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: "0.9375rem",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: "0.875rem" }}>
          <span style={{ fontWeight: 600, color: "#374151" }}>
            Total costs ($)
          </span>
          <input
            type="number"
            value={costs}
            onChange={(e) => setCosts(e.target.value)}
            placeholder="e.g. 3000"
            min="0"
            step="0.01"
            style={{
              padding: "6px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              fontSize: "0.9375rem",
            }}
          />
        </label>
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: profit >= 0 ? "#dcfce7" : "#fee2e2",
          borderRadius: 6,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}
          >
            NET PROFIT
          </div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: profit >= 0 ? "#16a34a" : "#dc2626",
            }}
          >
            ${profit.toFixed(2)}
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}
          >
            MARGIN
          </div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: profit >= 0 ? "#16a34a" : "#dc2626",
            }}
          >
            {margin}%
          </div>
        </div>
      </div>
    </div>
  );
}
