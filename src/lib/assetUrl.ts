export function withAssetVersion(
  pathOrUrl: string | null | undefined,
  version: string | null | undefined,
): string | undefined {
  const normalizedPathOrUrl = pathOrUrl?.trim();
  if (!normalizedPathOrUrl) {
    return undefined;
  }

  const normalizedVersion = version?.trim();
  if (!normalizedVersion) {
    return normalizedPathOrUrl;
  }

  try {
    const isAbsoluteUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedPathOrUrl);
    const parsedUrl = new URL(normalizedPathOrUrl, "http://localhost");

    parsedUrl.searchParams.set("v", normalizedVersion);

    if (isAbsoluteUrl) {
      return parsedUrl.toString();
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    const separator = normalizedPathOrUrl.includes("?") ? "&" : "?";
    return `${normalizedPathOrUrl}${separator}v=${encodeURIComponent(normalizedVersion)}`;
  }
}
