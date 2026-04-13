/**
 * ImageBlock – TipTap block node extension.
 *
 * An atomic image block that stores src, alt, and optional caption as node
 * attributes. The NodeView renders an edit form; serialised HTML is a
 * semantic <figure> element.
 *
 * HTML output example:
 * <figure data-sbt-block="image">
 *   <img src="/images/example.jpg" alt="Example">
 *   <figcaption>Caption text</figcaption>
 * </figure>
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { LockedBadge } from "./LockedBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageBlockAttrs {
  src: string;
  alt: string;
  caption: string;
}

// ─── Node View ────────────────────────────────────────────────────────────────

function ImageBlockView({ node, updateAttributes }: NodeViewProps) {
  const { src, alt, caption } = node.attrs as ImageBlockAttrs;
  const isLocked = node.attrs.locked === true;
  const lockReason = node.attrs.lockReason as string | null | undefined;

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 3,
    fontSize: "0.8125rem",
    background: isLocked ? "#f3f4f6" : "#fff",
    cursor: isLocked ? "not-allowed" : "text",
    color: isLocked ? "#6b7280" : "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: 2,
    color: "#374151",
  };

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        style={{
          border: "1px dashed #9ca3af",
          borderRadius: 6,
          padding: "12px 16px",
          background: "#f9fafb",
          margin: "12px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#6b7280",
            marginBottom: 10,
          }}
        >
          Image Block
          {isLocked && <LockedBadge reason={lockReason} />}
        </div>

        {/* Preview */}
        {src && (
          /* eslint-disable-next-line @next/next/no-img-element -- TipTap node previews can reference arbitrary authored URLs and are intentionally rendered as plain img elements. */
          <img
            src={src}
            alt={alt || ""}
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: "100%",
              maxHeight: 200,
              objectFit: "contain",
              borderRadius: 4,
              marginBottom: 10,
              display: "block",
              border: "1px solid #e5e7eb",
            }}
          />
        )}

        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <span style={labelStyle}>Image URL</span>
            <input
              type="text"
              value={src || ""}
              onChange={(e) => updateAttributes({ src: e.target.value })}
              placeholder="/images/example.jpg"
              readOnly={isLocked}
              style={fieldStyle}
            />
          </div>

          <div>
            <span style={labelStyle}>Alt text (accessibility)</span>
            <input
              type="text"
              value={alt || ""}
              onChange={(e) => updateAttributes({ alt: e.target.value })}
              placeholder="Describe the image…"
              readOnly={isLocked}
              style={fieldStyle}
            />
          </div>

          <div>
            <span style={labelStyle}>Caption (optional)</span>
            <input
              type="text"
              value={caption || ""}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder="Optional caption text"
              readOnly={isLocked}
              style={fieldStyle}
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("img")?.getAttribute("src") || "",
        renderHTML: () => ({}),
      },
      alt: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("img")?.getAttribute("alt") || "",
        renderHTML: () => ({}),
      },
      caption: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("figcaption")?.textContent?.trim() || "",
        renderHTML: () => ({}),
      },
      locked: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-locked") === "true",
        renderHTML: (attrs: { locked?: boolean }) =>
          attrs.locked ? { "data-locked": "true" } : {},
      },
      lockReason: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-lock-reason") || null,
        renderHTML: (attrs: { lockReason?: string | null }) =>
          attrs.lockReason ? { "data-lock-reason": attrs.lockReason } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-sbt-block="image"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // `HTMLAttributes` carries data-locked / data-lock-reason when set.
    // Build nested figure/img/figcaption from attributes.
    const children: unknown[] = [
      ["img", { src: node.attrs.src || "", alt: node.attrs.alt || "" }],
    ];
    if (node.attrs.caption) {
      children.push(["figcaption", {}, node.attrs.caption]);
    }
    return [
      "figure",
      mergeAttributes({ "data-sbt-block": "image" }, HTMLAttributes),
      ...children,
    ] as unknown as [string, Record<string, string>];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
