export type SortDirection = "asc" | "desc";

export function compareSortValues(
  left: string | number,
  right: string | number,
  direction: SortDirection,
): number {
  if (left < right) {
    return direction === "asc" ? -1 : 1;
  }

  if (left > right) {
    return direction === "asc" ? 1 : -1;
  }

  return 0;
}

export function parseCurrencyValue(value?: string): number {
  return parseFloat((value ?? "").replace(/[^0-9.]/g, "")) || 0;
}
