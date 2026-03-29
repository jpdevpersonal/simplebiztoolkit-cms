export type EntityWithId = {
  id: string;
};

export function normalizeOrderedMenuItemIds(input: unknown): string[] {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  if (typeof input === "string") {
    const raw = input.trim();
    if (!raw) return [];

    try {
      return normalizeOrderedMenuItemIds(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

export function orderEntitiesByIds<T extends EntityWithId>(
  items: readonly T[],
  orderedIds?: readonly string[] | null,
): T[] {
  if (!orderedIds || orderedIds.length === 0) {
    return [...items];
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const ordered: T[] = [];

  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    const candidate = byId.get(id);
    if (!candidate) continue;
    seen.add(id);
    ordered.push(candidate);
  }

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    ordered.push(item);
  }

  return ordered;
}

export function hasSameIdOrder<T extends EntityWithId>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.id === right[index]?.id);
}
