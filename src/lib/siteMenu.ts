import {
  hiddenStaticOrderIdToStaticOrderId,
  isHiddenStaticNavOrderId,
  isStaticNavOrderId,
  staticNavItems,
  toStaticNavOrderId,
} from "@/config/staticNavItems";
import { normalizeOrderedMenuItemIds } from "@/lib/menuLayout";

export type MenuNavPage = { id: string; title: string; href: string };

export type MenuNavGroup = {
  categoryId?: string;
  categoryTitle?: string;
  pages: MenuNavPage[];
};

export type MenuNavItem = {
  id: string;
  title: string;
  directHref?: string;
  groups?: MenuNavGroup[];
};

export type OrderedStaticMenuEntry = {
  kind: "static";
  orderId: string;
  to: string;
  label: string;
};

export type OrderedCmsMenuEntry = {
  kind: "cms";
  orderId: string;
  item: MenuNavItem;
};

export type OrderedMenuEntry = OrderedStaticMenuEntry | OrderedCmsMenuEntry;

export function composeOrderedMenuEntries(
  menuNavItems: MenuNavItem[] = [],
  navOrderIds: string[] = [],
): OrderedMenuEntry[] {
  const normalizedOrderIds = normalizeOrderedMenuItemIds(navOrderIds);
  const hiddenStaticOrderIds = new Set<string>();

  for (const id of normalizedOrderIds) {
    const mappedStaticId = hiddenStaticOrderIdToStaticOrderId(id);
    if (mappedStaticId) {
      hiddenStaticOrderIds.add(mappedStaticId);
    }
  }

  const orderedStaticItems: OrderedStaticMenuEntry[] = staticNavItems
    .map((item) => ({
      kind: "static" as const,
      to: item.to,
      label: item.label,
      orderId: toStaticNavOrderId(item.to),
    }))
    .filter((item) => !hiddenStaticOrderIds.has(item.orderId));

  const orderedCmsItems: OrderedCmsMenuEntry[] = menuNavItems.map((item) => ({
    kind: "cms" as const,
    item,
    orderId: item.id,
  }));

  if (normalizedOrderIds.length === 0) {
    return [...orderedStaticItems, ...orderedCmsItems];
  }

  const positionalOrderIds = normalizedOrderIds.filter(
    (id) => !isHiddenStaticNavOrderId(id),
  );

  const includesManagedStaticTokens = normalizedOrderIds.some(
    (id) => isStaticNavOrderId(id) || isHiddenStaticNavOrderId(id),
  );

  if (!includesManagedStaticTokens) {
    const cmsById = new Map(
      orderedCmsItems.map((entry) => [entry.orderId, entry]),
    );
    const seenCms = new Set<string>();
    const orderedCms: OrderedCmsMenuEntry[] = [];

    for (const id of positionalOrderIds) {
      if (seenCms.has(id)) continue;
      const entry = cmsById.get(id);
      if (!entry) continue;
      seenCms.add(id);
      orderedCms.push(entry);
    }

    for (const entry of orderedCmsItems) {
      if (seenCms.has(entry.orderId)) continue;
      seenCms.add(entry.orderId);
      orderedCms.push(entry);
    }

    return [...orderedStaticItems, ...orderedCms];
  }

  const allEntries: OrderedMenuEntry[] = [
    ...orderedStaticItems,
    ...orderedCmsItems,
  ];
  const byId = new Map(allEntries.map((entry) => [entry.orderId, entry]));
  const ordered: OrderedMenuEntry[] = [];
  const seen = new Set<string>();

  for (const rawId of positionalOrderIds) {
    const lookupIds = rawId.startsWith("cms:")
      ? [rawId, rawId.slice(4)]
      : [rawId];

    let matched: OrderedMenuEntry | undefined;
    for (const lookupId of lookupIds) {
      matched = byId.get(lookupId);
      if (matched) break;
    }

    if (!matched || seen.has(matched.orderId)) continue;
    seen.add(matched.orderId);
    ordered.push(matched);
  }

  for (const entry of allEntries) {
    if (seen.has(entry.orderId)) continue;
    seen.add(entry.orderId);
    ordered.push(entry);
  }

  return ordered;
}

export function getOrderedMenuEntryHref(
  entry: OrderedMenuEntry,
): string | undefined {
  return entry.kind === "static" ? entry.to : entry.item.directHref;
}
