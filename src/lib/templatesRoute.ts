const LEGACY_TEMPLATE_ROUTE_ALIASES: ReadonlyArray<readonly [string, string]> =
  [
    ["/preview/products", "/preview/templates"],
    ["/admin/products", "/admin/templates"],
    ["/products", "/templates"],
  ];

export function toTemplatesRoute(path?: string | null): string | undefined {
  if (!path) return undefined;

  const trimmed = path.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  for (const [legacyPrefix, canonicalPrefix] of LEGACY_TEMPLATE_ROUTE_ALIASES) {
    if (
      normalized === legacyPrefix ||
      normalized.startsWith(`${legacyPrefix}/`)
    ) {
      return `${canonicalPrefix}${normalized.slice(legacyPrefix.length)}`;
    }
  }

  return normalized;
}
