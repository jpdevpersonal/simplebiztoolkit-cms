type Props = {
  active: boolean;
  dir: "asc" | "desc";
};

export default function AdminSortIcon({ active, dir }: Props) {
  return (
    <span
      className="admin-sort-icon"
      style={{ opacity: active ? 1 : 0.3 }}
      aria-hidden="true"
    >
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}
