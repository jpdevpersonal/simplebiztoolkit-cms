type SitemapLastModifiedInput = Date | string | null | undefined;

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function toValidSitemapDate(value: SitemapLastModifiedInput): Date | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.toLowerCase() === "invalid date") {
    return undefined;
  }

  const isSupportedFormat =
    ISO_DATE_ONLY.test(trimmedValue) || ISO_DATE_TIME.test(trimmedValue);
  if (!isSupportedFormat) {
    return undefined;
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

export function toSitemapLastModified(
  ...values: SitemapLastModifiedInput[]
): Date | undefined {
  for (const value of values) {
    const parsedDate = toValidSitemapDate(value);
    if (parsedDate) {
      return parsedDate;
    }
  }

  return undefined;
}
