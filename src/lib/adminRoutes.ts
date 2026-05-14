export const CMS_ROUTE_PREFIX = "/cms";
export const CMS_HOME_PATH = CMS_ROUTE_PREFIX;
export const CMS_LOGIN_PATH = `${CMS_ROUTE_PREFIX}/login`;
export const LEGACY_ADMIN_ROUTE_PREFIX = "/admin";

export function isCmsPath(pathname: string): boolean {
  return (
    pathname === CMS_ROUTE_PREFIX || pathname.startsWith(`${CMS_ROUTE_PREFIX}/`)
  );
}

export function isLegacyAdminPath(pathname: string): boolean {
  return (
    pathname === LEGACY_ADMIN_ROUTE_PREFIX ||
    pathname.startsWith(`${LEGACY_ADMIN_ROUTE_PREFIX}/`)
  );
}

export function toCmsPath(href: string): string {
  if (
    href === LEGACY_ADMIN_ROUTE_PREFIX ||
    href.startsWith(`${LEGACY_ADMIN_ROUTE_PREFIX}/`) ||
    href.startsWith(`${LEGACY_ADMIN_ROUTE_PREFIX}?`) ||
    href.startsWith(`${LEGACY_ADMIN_ROUTE_PREFIX}#`)
  ) {
    return `${CMS_ROUTE_PREFIX}${href.slice(LEGACY_ADMIN_ROUTE_PREFIX.length)}`;
  }

  return href;
}

export function toLegacyAdminPath(href: string): string {
  if (
    href === CMS_ROUTE_PREFIX ||
    href.startsWith(`${CMS_ROUTE_PREFIX}/`) ||
    href.startsWith(`${CMS_ROUTE_PREFIX}?`) ||
    href.startsWith(`${CMS_ROUTE_PREFIX}#`)
  ) {
    return `${LEGACY_ADMIN_ROUTE_PREFIX}${href.slice(CMS_ROUTE_PREFIX.length)}`;
  }

  return href;
}

export function getSafeCmsCallbackUrl(
  rawCallbackUrl: string | null | undefined,
  origin = "http://localhost",
): string {
  const fallback = CMS_HOME_PATH;
  const trimmedCallbackUrl = rawCallbackUrl?.trim();

  if (!trimmedCallbackUrl) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmedCallbackUrl, origin);

    if (parsed.origin !== origin) {
      return fallback;
    }

    const canonicalPathname = toCmsPath(parsed.pathname);

    if (!isCmsPath(canonicalPathname)) {
      return fallback;
    }

    if (
      canonicalPathname === CMS_LOGIN_PATH ||
      canonicalPathname.startsWith(`${CMS_LOGIN_PATH}/`)
    ) {
      return fallback;
    }

    return `${canonicalPathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
