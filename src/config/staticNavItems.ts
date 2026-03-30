export type StaticNavItem = {
  to: string;
  label: string;
};

export const STATIC_NAV_ORDER_PREFIX = "static:";
export const HIDDEN_STATIC_NAV_ORDER_PREFIX = "hidden-static:";

export const staticNavItems: StaticNavItem[] = [
  { to: "/products", label: "Templates" },
  { to: "/testimonials", label: "Reviews" },
  { to: "/faq", label: "FAQ" },
  { to: "/help", label: "Help" },
  { to: "/contact", label: "Contact" },
  { to: "/about", label: "About" },
];

export function toStaticNavOrderId(path: string): string {
  return `${STATIC_NAV_ORDER_PREFIX}${path}`;
}

export function isStaticNavOrderId(value: string): boolean {
  return value.startsWith(STATIC_NAV_ORDER_PREFIX);
}

export function toHiddenStaticNavOrderId(path: string): string {
  return `${HIDDEN_STATIC_NAV_ORDER_PREFIX}${path}`;
}

export function isHiddenStaticNavOrderId(value: string): boolean {
  return value.startsWith(HIDDEN_STATIC_NAV_ORDER_PREFIX);
}

export function hiddenStaticOrderIdToStaticOrderId(
  value: string,
): string | null {
  if (!isHiddenStaticNavOrderId(value)) return null;
  const path = value.slice(HIDDEN_STATIC_NAV_ORDER_PREFIX.length);
  if (!path) return null;
  return toStaticNavOrderId(path);
}
