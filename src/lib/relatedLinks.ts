export const RELATED_LINKS_BLOCK_TYPE = "related-links";
export const RELATED_LINKS_DEFAULT_TITLE = "Related to this";
export const RELATED_LINKS_DEFAULT_BACKGROUND = "#f8f9fb";
export const RELATED_LINKS_DEFAULT_BORDER_WIDTH = 1;
export const RELATED_LINKS_DEFAULT_IMAGE_SIZE = "small";
export const RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y = 50;
export const RELATED_LINKS_MAX_ITEMS = 5;

export type RelatedLinkKind = "page" | "template" | "custom";
export type RelatedLinksImageSize =
  | "small"
  | "medium"
  | "large"
  | "extra-large";

export interface RelatedLinkItem {
  uid: string;
  kind: RelatedLinkKind;
  refId: string;
  href: string;
  destinationTitle: string;
  label?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imagePositionY?: number | null;
}

export interface RelatedLinksBlockData {
  title: string;
  items: RelatedLinkItem[];
  backgroundColor?: string;
  borderWidth?: number;
  imageSize?: RelatedLinksImageSize;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Create a related-link uid.
 * If a seed is provided we create a stable uid derived from the seed so
 * server and client will produce the same id for identical content.
 * If no seed is provided, fall back to the original non-deterministic uid
 * (used in draft/editor contexts where uniqueness is required).
 */
export function createRelatedLinkUid(seed?: string): string {
  if (typeof seed === "string" && seed.trim().length > 0) {
    // stable hash => base36 string
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
    }
    return `related-link-${h.toString(36)}`;
  }

  return `related-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isInternalRelatedLinkHref(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

export function normalizeCustomRelatedLinkHref(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (isInternalRelatedLinkHref(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.protocol === "http:" || url.protocol === "https:"
        ? trimmed
        : null;
    } catch {
      return null;
    }
  }

  if (
    !trimmed ||
    trimmed.startsWith("//") ||
    trimmed.includes(":") ||
    /\s/.test(trimmed)
  ) {
    return null;
  }

  try {
    const url = new URL(`https://${trimmed}`);
    if (!url.hostname.includes(".")) {
      return null;
    }
    return `https://${trimmed}`;
  } catch {
    return null;
  }
}

export function isCustomRelatedLinkHref(value: unknown): value is string {
  return normalizeCustomRelatedLinkHref(value) !== null;
}

export function normalizeRelatedLinksTitle(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || RELATED_LINKS_DEFAULT_TITLE;
}

export function normalizeRelatedLinksBorderWidth(
  value?: number | null,
): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(12, value));
}

export function normalizeRelatedLinksImageSize(
  value?: string | null,
): RelatedLinksImageSize {
  return value === "medium" || value === "large" || value === "extra-large"
    ? (value as RelatedLinksImageSize)
    : RELATED_LINKS_DEFAULT_IMAGE_SIZE;
}

export function normalizeRelatedLinkImagePositionY(
  value?: number | string | null,
): number {
  const numericValue =
    typeof value === "string"
      ? Number(value)
      : typeof value === "number"
        ? value
        : RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y;

  if (!Number.isFinite(numericValue)) {
    return RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function parseAttributeFromHtmlString(
  attributes: string,
  name: string,
): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const match = attributes.match(regex);
  return decodeHtmlEntities(match?.[1] ?? match?.[2] ?? "");
}

function sanitizeRelatedLinkKind(value: unknown): RelatedLinkKind | null {
  return value === "page" || value === "template" || value === "custom"
    ? value
    : null;
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function sanitizeDraftRelatedLinkItem(value: unknown): RelatedLinkItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = sanitizeRelatedLinkKind(value.kind) ?? "page";

  const refId =
    typeof value.refId === "string" && value.refId.trim()
      ? value.refId.trim()
      : "";
  const href =
    typeof value.href === "string" && value.href.trim()
      ? value.href.trim()
      : "";
  const destinationTitle =
    typeof value.destinationTitle === "string"
      ? value.destinationTitle.trim()
      : "";
  const label = typeof value.label === "string" ? value.label : null;
  const imageId = normalizeNullableString(value.imageId);
  const imageUrl = normalizeNullableString(value.imageUrl);
  const imageAlt = normalizeNullableString(value.imageAlt);

  const rawImagePositionY = value.imagePositionY;
  const imagePositionY =
    typeof rawImagePositionY === "string" ||
    typeof rawImagePositionY === "number"
      ? rawImagePositionY
      : undefined;

  const uid =
    typeof value.uid === "string" && value.uid.trim()
      ? value.uid.trim()
      : createRelatedLinkUid(
          `${kind}|${refId}|${href}|${destinationTitle}|${imageUrl ?? ""}`,
        );

  return {
    uid,
    kind,
    refId,
    href,
    destinationTitle,
    label,
    imageId,
    imageUrl,
    imageAlt,
    imagePositionY: normalizeRelatedLinkImagePositionY(imagePositionY),
  };
}

function sanitizeRelatedLinkItem(value: unknown): RelatedLinkItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = sanitizeRelatedLinkKind(value.kind);
  const href = typeof value.href === "string" ? value.href.trim() : "";
  const destinationTitle =
    typeof value.destinationTitle === "string"
      ? value.destinationTitle.trim()
      : "";
  const refId = typeof value.refId === "string" ? value.refId.trim() : "";
  const imageUrl =
    typeof value.imageUrl === "string" && value.imageUrl.trim()
      ? value.imageUrl.trim()
      : null;

  if (!kind) {
    return null;
  }

  const customHref =
    kind === "custom" ? normalizeCustomRelatedLinkHref(href) : null;

  if (kind === "custom") {
    if (!customHref) {
      return null;
    }
  } else if (!isInternalRelatedLinkHref(href) || !destinationTitle || !refId) {
    return null;
  }

  const uid =
    typeof value.uid === "string" && value.uid.trim()
      ? value.uid.trim()
      : createRelatedLinkUid(
          `${kind}|${refId}|${href}|${destinationTitle}|${imageUrl ?? ""}`,
        );
  const label = typeof value.label === "string" ? value.label.trim() : "";
  const imageId =
    typeof value.imageId === "string" && value.imageId.trim()
      ? value.imageId.trim()
      : null;
  const imageAlt =
    typeof value.imageAlt === "string" && value.imageAlt.trim()
      ? value.imageAlt.trim()
      : null;
  const rawImagePositionY = value.imagePositionY;
  const imagePositionY = normalizeRelatedLinkImagePositionY(
    typeof rawImagePositionY === "string" ||
      typeof rawImagePositionY === "number"
      ? rawImagePositionY
      : undefined,
  );

  return {
    uid,
    kind,
    refId,
    href: customHref ?? href,
    destinationTitle:
      destinationTitle ||
      (kind === "custom" ? label || customHref || href : ""),
    label: label || null,
    imageId,
    imageUrl,
    imageAlt,
    imagePositionY,
  };
}

export function sanitizeRelatedLinksItems(value: unknown): RelatedLinkItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeRelatedLinkItem(item))
    .filter((item): item is RelatedLinkItem => Boolean(item))
    .slice(0, RELATED_LINKS_MAX_ITEMS);
}

export function normalizeRelatedLinksDraftItems(
  value: unknown,
): RelatedLinkItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeDraftRelatedLinkItem(item))
    .filter((item): item is RelatedLinkItem => Boolean(item))
    .slice(0, RELATED_LINKS_MAX_ITEMS);
}

export function encodeRelatedLinksItems(items: RelatedLinkItem[]): string {
  return encodeURIComponent(JSON.stringify(sanitizeRelatedLinksItems(items)));
}

export function decodeRelatedLinksItems(
  value?: string | null,
): RelatedLinkItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return sanitizeRelatedLinksItems(parsed);
  } catch {
    return [];
  }
}

export function normalizeRelatedLinksBlock(
  value: Partial<RelatedLinksBlockData>,
): RelatedLinksBlockData {
  return {
    title: normalizeRelatedLinksTitle(value.title),
    items: sanitizeRelatedLinksItems(value.items),
    backgroundColor:
      typeof value.backgroundColor === "string" && value.backgroundColor.trim()
        ? value.backgroundColor.trim()
        : undefined,
    borderWidth: normalizeRelatedLinksBorderWidth(value.borderWidth),
    imageSize: normalizeRelatedLinksImageSize(value.imageSize),
  };
}

function encodeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function serializeRelatedLinksBlockToHtml(
  value: Partial<RelatedLinksBlockData>,
): string {
  const block = normalizeRelatedLinksBlock(value);

  if (block.items.length === 0) {
    return "";
  }

  const attributes = [
    `class="related-links-block"`,
    `data-sbt-block="${RELATED_LINKS_BLOCK_TYPE}"`,
    `data-title="${encodeHtmlAttribute(block.title)}"`,
    `data-items="${encodeHtmlAttribute(encodeRelatedLinksItems(block.items))}"`,
  ];

  if (block.backgroundColor) {
    attributes.push(
      `data-background-color="${encodeHtmlAttribute(block.backgroundColor)}"`,
    );
  }

  if (typeof block.borderWidth === "number") {
    attributes.push(`data-border-width="${block.borderWidth}"`);
  }

  if (block.imageSize) {
    attributes.push(
      `data-image-size="${encodeHtmlAttribute(block.imageSize)}"`,
    );
  }

  return `<section ${attributes.join(" ")}></section>`;
}

export function parseRelatedLinksBlockFromAttributes(
  attributes: string,
): RelatedLinksBlockData {
  const items = decodeRelatedLinksItems(
    parseAttributeFromHtmlString(attributes, "data-items"),
  );
  const borderWidthRaw = parseAttributeFromHtmlString(
    attributes,
    "data-border-width",
  );
  const borderWidth = borderWidthRaw ? Number(borderWidthRaw) : undefined;

  return normalizeRelatedLinksBlock({
    title: parseAttributeFromHtmlString(attributes, "data-title"),
    items,
    backgroundColor: parseAttributeFromHtmlString(
      attributes,
      "data-background-color",
    ),
    borderWidth: Number.isFinite(borderWidth) ? borderWidth : undefined,
    imageSize: normalizeRelatedLinksImageSize(
      parseAttributeFromHtmlString(attributes, "data-image-size"),
    ),
  });
}

export function extractRelatedLinksBlocksFromHtml(html: string): {
  htmlWithoutRelatedLinks: string;
  blocks: RelatedLinksBlockData[];
} {
  const regex = new RegExp(
    `<section\\b([^>]*)data-sbt-block=["']${RELATED_LINKS_BLOCK_TYPE}["']([^>]*)>[\\s\\S]*?<\\/section>`,
    "gi",
  );
  const blocks: RelatedLinksBlockData[] = [];

  const htmlWithoutRelatedLinks = html.replace(
    regex,
    (match, before, after) => {
      const block = parseRelatedLinksBlockFromAttributes(`${before} ${after}`);
      if (block.items.length > 0) {
        blocks.push(block);
      }

      return "";
    },
  );

  return {
    htmlWithoutRelatedLinks,
    blocks,
  };
}
