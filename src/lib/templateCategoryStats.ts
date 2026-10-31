type CategoryItemLike = {
  image?: string | null;
  price?: string | null;
  priceAmount?: number | null;
};

export type TemplateCategoryStats = {
  count: number;
  /** Display string of the lowest-priced item, e.g. "$1.93". */
  fromPrice: string | null;
  previewImage: string | null;
};

function toAmount(item: CategoryItemLike): number {
  if (typeof item.priceAmount === "number" && item.priceAmount > 0) {
    return item.priceAmount;
  }
  const parsed = Number.parseFloat((item.price ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
}

/** Summarises a template category for cards and headers. */
export function getTemplateCategoryStats(
  items: CategoryItemLike[] | null | undefined,
): TemplateCategoryStats {
  const list = items ?? [];
  const cheapest = list.reduce<CategoryItemLike | null>(
    (best, item) =>
      toAmount(item) < (best ? toAmount(best) : Infinity) ? item : best,
    null,
  );

  return {
    count: list.length,
    fromPrice: cheapest?.price?.trim() || null,
    previewImage: list.find((item) => item.image?.trim())?.image ?? null,
  };
}

export function formatTemplateCount(count: number): string {
  return `${count} template${count === 1 ? "" : "s"}`;
}
