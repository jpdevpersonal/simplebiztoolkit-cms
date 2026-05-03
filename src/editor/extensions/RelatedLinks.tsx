import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import RelatedLinksEditor from "@/components/RelatedLinksEditor";
import {
  decodeRelatedLinksItems,
  encodeRelatedLinksItems,
  normalizeRelatedLinkImagePositionY,
  normalizeRelatedLinksImageSize,
  normalizeRelatedLinksTitle,
  RELATED_LINKS_BLOCK_TYPE,
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  RELATED_LINKS_DEFAULT_IMAGE_SIZE,
  RELATED_LINKS_DEFAULT_TITLE,
  sanitizeRelatedLinksItems,
  type RelatedLinkItem,
  type RelatedLinksImageSize,
} from "@/lib/relatedLinks";
import { LockedBadge } from "./LockedBadge";

function getDestinationLabel(item: RelatedLinkItem): string {
  return item.label?.trim() || item.destinationTitle;
}

function RelatedLinksView({ node, updateAttributes }: NodeViewProps) {
  const readyItems = sanitizeRelatedLinksItems(node.attrs.items).length;
  const isLocked = node.attrs.locked === true;
  const lockReason = node.attrs.lockReason as string | null | undefined;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <NodeViewWrapper>
      <div contentEditable={false} className="related-links-node-shell">
        <div className="related-links-node-header">
          <div className="related-links-node-title-row">
            <span className="related-links-node-title">
              Related Links Block
            </span>
            <span className="related-links-node-summary">
              {readyItems > 0
                ? `${readyItems} ready ${readyItems === 1 ? "link" : "links"}`
                : "No links selected yet"}
            </span>
          </div>
          {isLocked && <LockedBadge reason={lockReason} />}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="related-links-node-toggle"
          >
            {isExpanded ? "Hide settings" : "Settings"}
          </button>
        </div>

        {isExpanded ? (
          <RelatedLinksEditor
            value={{
              title: node.attrs.title as string | undefined,
              items: node.attrs.items as RelatedLinkItem[] | undefined,
              backgroundColor: node.attrs.backgroundColor as string | undefined,
              borderWidth: node.attrs.borderWidth as number | undefined,
              imageSize: node.attrs.imageSize as
                | RelatedLinksImageSize
                | undefined,
            }}
            onChange={(nextValue) => updateAttributes(nextValue)}
            disabled={isLocked}
            previewHint="This preview stays inline where the block sits in the page content."
          />
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const RelatedLinks = Node.create({
  name: "relatedLinksSbtBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: {
        default: RELATED_LINKS_DEFAULT_TITLE,
        parseHTML: (element: HTMLElement) =>
          normalizeRelatedLinksTitle(element.getAttribute("data-title")),
        renderHTML: (attributes: { title?: string }) => ({
          "data-title": normalizeRelatedLinksTitle(attributes.title),
        }),
      },
      items: {
        default: [],
        parseHTML: (element: HTMLElement) =>
          decodeRelatedLinksItems(element.getAttribute("data-items")),
        renderHTML: (attributes: { items?: RelatedLinkItem[] }) => ({
          "data-items": encodeRelatedLinksItems(attributes.items || []),
        }),
      },
      backgroundColor: {
        default: RELATED_LINKS_DEFAULT_BACKGROUND,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-background-color") ||
          RELATED_LINKS_DEFAULT_BACKGROUND,
        renderHTML: (attributes: { backgroundColor?: string }) => ({
          "data-background-color":
            attributes.backgroundColor || RELATED_LINKS_DEFAULT_BACKGROUND,
        }),
      },
      borderWidth: {
        default: RELATED_LINKS_DEFAULT_BORDER_WIDTH,
        parseHTML: (element: HTMLElement) => {
          const value = Number(element.getAttribute("data-border-width"));
          return Number.isFinite(value)
            ? value
            : RELATED_LINKS_DEFAULT_BORDER_WIDTH;
        },
        renderHTML: (attributes: { borderWidth?: number }) => ({
          "data-border-width": String(
            typeof attributes.borderWidth === "number"
              ? attributes.borderWidth
              : RELATED_LINKS_DEFAULT_BORDER_WIDTH,
          ),
        }),
      },
      imageSize: {
        default: RELATED_LINKS_DEFAULT_IMAGE_SIZE,
        parseHTML: (element: HTMLElement) =>
          normalizeRelatedLinksImageSize(
            element.getAttribute("data-image-size"),
          ),
        renderHTML: (attributes: { imageSize?: string }) => ({
          "data-image-size": normalizeRelatedLinksImageSize(
            attributes.imageSize,
          ),
        }),
      },
      locked: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-locked") === "true",
        renderHTML: (attrs: { locked?: boolean }) =>
          attrs.locked ? { "data-locked": "true" } : {},
      },
      lockReason: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-lock-reason") || null,
        renderHTML: (attrs: { lockReason?: string | null }) =>
          attrs.lockReason ? { "data-lock-reason": attrs.lockReason } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: `section[data-sbt-block="${RELATED_LINKS_BLOCK_TYPE}"]` }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const title = normalizeRelatedLinksTitle(node.attrs.title);
    const items = sanitizeRelatedLinksItems(node.attrs.items);
    const imageSize = normalizeRelatedLinksImageSize(node.attrs.imageSize);
    const hasAnyImages = items.some((item) => Boolean(item.imageUrl));
    const children: unknown[] = [
      ["h3", {}, title],
      [
        "ul",
        { class: "related-links-block__list" },
        ...items.map((item) => {
          const imageChild = hasAnyImages
            ? item.imageUrl
              ? [
                  "span",
                  {
                    class: "related-links-block__media",
                    "aria-hidden": "true",
                  },
                  [
                    "img",
                    {
                      src: item.imageUrl,
                      alt: item.imageAlt || "",
                      style: `object-position: center ${normalizeRelatedLinkImagePositionY(item.imagePositionY)}%;`,
                      class: "related-links-block__image",
                    },
                  ],
                ]
              : [
                  "span",
                  {
                    class: "related-links-block__media-placeholder",
                    "aria-hidden": "true",
                  },
                ]
            : null;

          return [
            "li",
            { class: "related-links-block__item" },
            [
              "a",
              {
                href: item.href,
                class: `related-links-block__link${hasAnyImages ? "" : " related-links-block__link--text-only"}`,
                "data-link-kind": item.kind,
                "data-link-id": item.refId,
              },
              ...(imageChild ? [imageChild] : []),
              [
                "span",
                { class: "related-links-block__text" },
                getDestinationLabel(item),
              ],
            ],
          ];
        }),
      ],
    ];

    return [
      "section",
      mergeAttributes(
        {
          class: `related-links-block related-links-block--image-size-${imageSize}`,
          "data-sbt-block": RELATED_LINKS_BLOCK_TYPE,
        },
        HTMLAttributes,
      ),
      ...children,
    ] as unknown as [string, Record<string, string>];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RelatedLinksView);
  },
});
