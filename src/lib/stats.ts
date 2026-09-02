/**
 * Site trust statistics (Etsy rating, reviews, sales, star-seller badge).
 *
 * Values are always transported as strings — never converted to numbers —
 * so the CMS can store display-ready text such as "2500+" or "4.9".
 */

export const STAT_VALUE_MAX_LENGTH = 10;

export const STAT_NAMES = [
  "rating",
  "reviews",
  "sales",
  "star-seller",
] as const;

export type StatName = (typeof STAT_NAMES)[number];

export interface SiteStat {
  id: number;
  name: string;
  value: string;
  hidden: boolean;
}

export interface StatInput {
  value: string;
  hidden: boolean;
}

export interface BulkStatInput extends StatInput {
  name: StatName;
}

export type StatValueMap = Partial<Record<StatName, string>>;

export const STAT_LABELS: Record<StatName, string> = {
  rating: "Average Etsy rating",
  reviews: "Customer reviews",
  sales: "Sales",
  "star-seller": "Etsy Star Seller",
};

export const STAT_HINTS: Record<StatName, string> = {
  rating: 'Shown as "{value} average Etsy rating". Example: 4.9',
  reviews: 'Shown as "{value} customer reviews". Example: 1,250',
  sales: 'Shown as "{value} sales". Example: 2500+',
  "star-seller":
    'Choose Yes to show the "Etsy Star Seller" badge on the home page.',
};

export const STAT_YES_VALUE = "Yes";
export const STAT_NO_VALUE = "No";

const AFFIRMATIVE_VALUES = new Set(["yes", "y", "true", "1"]);

export function isStatName(value: string): value is StatName {
  return (STAT_NAMES as readonly string[]).includes(value);
}

/** Stats that hold a Yes/No answer rather than free text. */
export function isYesNoStat(name: StatName): boolean {
  return name === "star-seller";
}

/**
 * Reduce an API payload to the visible, usable values keyed by stat name.
 * Hidden, unknown or blank stats are dropped so callers can simply check
 * for presence before rendering.
 */
export function toVisibleStatMap(
  stats: readonly SiteStat[] | null | undefined,
): StatValueMap {
  const map: StatValueMap = {};

  for (const stat of stats ?? []) {
    if (!stat || stat.hidden) continue;

    const name = stat.name?.trim().toLowerCase() ?? "";
    if (!isStatName(name)) continue;

    const value = stat.value?.trim() ?? "";
    if (!value) continue;

    map[name] = value;
  }

  return map;
}

/** True when a badge-style stat value means "on" (e.g. "Yes", "true", "1"). */
export function isAffirmativeStat(value: string | undefined): boolean {
  return value ? AFFIRMATIVE_VALUES.has(value.trim().toLowerCase()) : false;
}

/** Coerce any stored representation of a Yes/No stat to "Yes" or "No". */
export function toYesNoStatValue(value: string | undefined): string {
  return isAffirmativeStat(value) ? STAT_YES_VALUE : STAT_NO_VALUE;
}

/**
 * Badge stats store an on/off answer, but may also hold custom label text.
 * Returns the text to render, or null when the badge should be omitted.
 */
export function getStarSellerLabel(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (isAffirmativeStat(trimmed)) return STAT_LABELS["star-seller"];
  if (/^(no|n|false|0)$/i.test(trimmed)) return null;
  return trimmed;
}

/** Returns a validation message, or null when the value is acceptable. */
export function validateStatValue(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Enter a value.";
  }

  if (trimmed.length > STAT_VALUE_MAX_LENGTH) {
    return `Value must be ${STAT_VALUE_MAX_LENGTH} characters or fewer (currently ${trimmed.length}).`;
  }

  return null;
}
