import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  valueSize?: "md" | "lg";
};

export default function AdminStatCard({
  label,
  value,
  note,
  valueSize = "md",
}: AdminStatCardProps) {
  return (
    <div className="sb-card p-3">
      <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: valueSize === "lg" ? "2rem" : "1.5rem",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      {note && (
        <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
          {note}
        </div>
      )}
    </div>
  );
}
