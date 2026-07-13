export function shouldBypassNextImageOptimization(
  src?: string | null,
): boolean {
  if (!src) return false;

  const trimmed = src.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/images/products/")) return true;
  if (trimmed.startsWith("/images/tools/")) return true;
  if (
    trimmed.startsWith("https://") &&
    trimmed.includes(".blob.core.windows.net/")
  ) {
    return true;
  }

  return false;
}
