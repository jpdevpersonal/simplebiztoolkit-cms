import { compactHtmlForStorage } from "@/lib/htmlFormatter";
import {
  extractRelatedLinksBlocksFromHtml,
  normalizeRelatedLinksBorderWidth,
  normalizeRelatedLinksDraftItems,
  normalizeRelatedLinksImageSize,
  normalizeRelatedLinksTitle,
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  RELATED_LINKS_MAX_ITEMS,
  serializeRelatedLinksBlockToHtml,
  type RelatedLinksBlockData,
} from "@/lib/relatedLinks";

/**
 * Normalize a partial related-links block into a complete, valid block with
 * sensible defaults. Shared by the page and template (product) editors.
 */
export function normalizeRelatedLinksBlock(
  value?: Partial<RelatedLinksBlockData>,
): RelatedLinksBlockData {
  return {
    title: normalizeRelatedLinksTitle(value?.title),
    items: normalizeRelatedLinksDraftItems(value?.items),
    backgroundColor:
      typeof value?.backgroundColor === "string" && value.backgroundColor.trim()
        ? value.backgroundColor.trim()
        : RELATED_LINKS_DEFAULT_BACKGROUND,
    borderWidth:
      normalizeRelatedLinksBorderWidth(value?.borderWidth) ??
      RELATED_LINKS_DEFAULT_BORDER_WIDTH,
    imageSize: normalizeRelatedLinksImageSize(value?.imageSize),
  };
}

/**
 * Split stored HTML into the editable inline content plus a normalized
 * related-links block extracted from it.
 */
export function splitContentAndRelatedLinks(content: string): {
  contentHtml: string;
  relatedLinks: RelatedLinksBlockData;
} {
  const { htmlWithoutRelatedLinks, blocks } =
    extractRelatedLinksBlocksFromHtml(content);

  if (blocks.length === 0) {
    return {
      contentHtml: content,
      relatedLinks: normalizeRelatedLinksBlock(),
    };
  }

  return {
    contentHtml: htmlWithoutRelatedLinks.trim(),
    relatedLinks: normalizeRelatedLinksBlock({
      title: blocks[0]?.title,
      backgroundColor: blocks[0]?.backgroundColor,
      borderWidth: blocks[0]?.borderWidth,
      imageSize: blocks[0]?.imageSize,
      items: blocks
        .flatMap((block) => block.items)
        .slice(0, RELATED_LINKS_MAX_ITEMS),
    }),
  };
}

/**
 * Recombine inline content HTML with a related-links block for storage.
 *
 * @param options.compact When true, the inline content is run through
 *   `compactHtmlForStorage` first (used by the page editor).
 */
export function buildContentWithRelatedLinks(
  contentHtml: string,
  relatedLinks: RelatedLinksBlockData,
  options: { compact?: boolean } = {},
): string {
  const source = options.compact
    ? compactHtmlForStorage(contentHtml)
    : contentHtml;
  const baseContent =
    extractRelatedLinksBlocksFromHtml(source).htmlWithoutRelatedLinks.trim();

  return [baseContent, serializeRelatedLinksBlockToHtml(relatedLinks)]
    .filter(Boolean)
    .join("\n");
}
