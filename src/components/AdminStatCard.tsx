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
    <div
      className={"admin-stat" + (valueSize === "lg" ? " admin-stat-lg" : "")}
    >
      <div className="admin-stat-label">{label}</div>
      <div
        className={
          "admin-stat-value" +
          (valueSize === "md" ? " admin-stat-value-md" : "")
        }
      >
        {value}
      </div>
      {note && <div className="admin-stat-note">{note}</div>}
    </div>
  );
}
