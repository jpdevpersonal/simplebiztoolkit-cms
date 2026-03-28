type Props = {
  active: boolean;
  dir: "asc" | "desc";
};

export default function AdminSortIcon({ active, dir }: Props) {
  return (
    <span
      className={"admin-sort-icon" + (active ? " is-active" : "")}
      aria-hidden="true"
    >
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}
