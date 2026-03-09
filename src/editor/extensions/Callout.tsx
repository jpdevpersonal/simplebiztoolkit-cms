/**
 * Callout – TipTap block node extension.
 *
 * Renders an editable callout box. Tone (info | warning | success) is
 * controlled via a dropdown in the NodeView. The serialised HTML uses
 * semantic class names and a `data-sbt-block` attribute so the
 * BlockRenderer and SEO scrapers can identify the element.
 *
 * HTML output example:
 * <div class="sbt-callout sbt-callout-info" data-sbt-block="callout" data-tone="info">
 *   <p>Message text</p>
 * </div>
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from "@tiptap/react";
import { LockedBadge } from "./LockedBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalloutTone = "info" | "warning" | "success";

const TONE_STYLES: Record<
  CalloutTone,
  { borderColor: string; background: string }
> = {
  info: { borderColor: "#3b82f6", background: "#eff6ff" },
  warning: { borderColor: "#f59e0b", background: "#fffbeb" },
  success: { borderColor: "#22c55e", background: "#f0fdf4" },
};

// ─── Node View ────────────────────────────────────────────────────────────────

function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const tone = (node.attrs.tone as CalloutTone) || "info";
  const { borderColor, background } = TONE_STYLES[tone] ?? TONE_STYLES.info;
  const isLocked = node.attrs.locked === true;
  const lockReason = node.attrs.lockReason as string | null | undefined;

  return (
    <NodeViewWrapper>
      <div
        data-sbt-block="callout"
        style={{
          borderLeft: `4px solid ${borderColor}`,
          background,
          borderRadius: 4,
          padding: "12px 16px",
          margin: "12px 0",
          opacity: isLocked ? 0.85 : 1,
        }}
      >
        {/* Toolbar – excluded from editor content */}
        <div
          contentEditable={false}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#6b7280",
            }}
          >
            Callout
          </span>
          {isLocked ? (
            <LockedBadge reason={lockReason} />
          ) : (
            <select
              value={tone}
              onChange={(e) => updateAttributes({ tone: e.target.value })}
              style={{
                fontSize: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: 3,
                padding: "1px 6px",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </select>
          )}
        </div>

        {/* Editable content area */}
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      tone: {
        default: "info" as CalloutTone,
        parseHTML: (el: HTMLElement) =>
          (el.getAttribute("data-tone") as CalloutTone) || "info",
        renderHTML: (attrs: { tone?: string }) => ({
          "data-tone": attrs.tone || "info",
        }),
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
    return [{ tag: 'div[data-sbt-block="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const tone = HTMLAttributes["data-tone"] || "info";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-sbt-block": "callout",
        class: `sbt-callout sbt-callout-${tone}`,
      }),
      0, // content hole
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
