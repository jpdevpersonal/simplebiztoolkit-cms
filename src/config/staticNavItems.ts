export type StaticNavItem = {
  to: string;
  label: string;
};

export const STATIC_NAV_ORDER_PREFIX = "static:";
export const HIDDEN_STATIC_NAV_ORDER_PREFIX = "hidden-static:";

const STATIC_NAV_PATH_ALIASES: Record<string, string> = {
  "/products": "/templates",
};

export const staticNavItems: StaticNavItem[] = [
  { to: "/templates", label: "Templates" },
  { to: "/testimonials", label: "Reviews" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
  { to: "/about", label: "About" },
];

export function canonicalizeStaticNavPath(path: string): string {
  return STATIC_NAV_PATH_ALIASES[path] ?? path;
}

export function toStaticNavOrderId(path: string): string {
  return `${STATIC_NAV_ORDER_PREFIX}${canonicalizeStaticNavPath(path)}`;
}

export function isStaticNavOrderId(value: string): boolean {
  return value.startsWith(STATIC_NAV_ORDER_PREFIX);
}

export function toHiddenStaticNavOrderId(path: string): string {
  return `${HIDDEN_STATIC_NAV_ORDER_PREFIX}${canonicalizeStaticNavPath(path)}`;
}

export function isHiddenStaticNavOrderId(value: string): boolean {
  return value.startsWith(HIDDEN_STATIC_NAV_ORDER_PREFIX);
}

export function canonicalizeStaticNavOrderId(value: string): string {
  if (isStaticNavOrderId(value)) {
    const path = value.slice(STATIC_NAV_ORDER_PREFIX.length);
    return path ? toStaticNavOrderId(path) : value;
  }

  if (isHiddenStaticNavOrderId(value)) {
    const path = value.slice(HIDDEN_STATIC_NAV_ORDER_PREFIX.length);
    return path ? toHiddenStaticNavOrderId(path) : value;
  }

  return value;
}

export function hiddenStaticOrderIdToStaticOrderId(
  value: string,
): string | null {
  if (!isHiddenStaticNavOrderId(value)) return null;
  const path = value.slice(HIDDEN_STATIC_NAV_ORDER_PREFIX.length);
  if (!path) return null;
  return toStaticNavOrderId(path);
}
