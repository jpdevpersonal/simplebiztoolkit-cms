/**
 * CTA – TipTap block node extension.
 *
 * An atomic (non-editable) call-to-action block. All content is stored as
 * node attributes and assembled into semantic HTML on serialisation.
 *
 * HTML output example:
 * <section class="sbt-cta" data-sbt-block="cta">
 *   <h2>Start Growing Your Business</h2>
 *   <p>Use the tools in SimpleBizToolkit.</p>
 *   <a href="/tools" class="cta-button">Try Now</a>
 * </section>
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { LockedBadge } from "./LockedBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CTAAttrs {
  title: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
}

// ─── Node View ────────────────────────────────────────────────────────────────

function CTAView({ node, updateAttributes }: NodeViewProps) {
  const { title, text, buttonText, buttonUrl } = node.attrs as CTAAttrs;
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
          CTA Block
          {isLocked && <LockedBadge reason={lockReason} />}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <span style={labelStyle}>Title</span>
            <input
              type="text"
              value={title || ""}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder="Start Growing Your Business"
              readOnly={isLocked}
              style={fieldStyle}
            />
          </div>

          <div>
            <span style={labelStyle}>Supporting text</span>
            <input
              type="text"
              value={text || ""}
              onChange={(e) => updateAttributes({ text: e.target.value })}
              placeholder="Add a supporting description…"
              readOnly={isLocked}
              style={fieldStyle}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <span style={labelStyle}>Button label</span>
              <input
                type="text"
                value={buttonText || ""}
                onChange={(e) =>
                  updateAttributes({ buttonText: e.target.value })
                }
                placeholder="Try Now"
                readOnly={isLocked}
                style={fieldStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Button URL</span>
              <input
                type="text"
                value={buttonUrl || ""}
                onChange={(e) =>
                  updateAttributes({ buttonUrl: e.target.value })
                }
                placeholder="/tools"
                readOnly={isLocked}
                style={fieldStyle}
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "#e5e7eb",
            borderRadius: 4,
            fontSize: "0.8125rem",
            color: "#374151",
          }}
        >
          <strong>{title || "CTA Title"}</strong>
          {text && <> — {text}</>}
          {buttonText && (
            <span
              style={{
                marginLeft: 8,
                padding: "2px 8px",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 3,
                fontSize: "0.75rem",
              }}
            >
              {buttonText}
            </span>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const CTA = Node.create({
  name: "ctaSbtBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: {
        default: "Start Growing Your Business",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("h2")?.textContent?.trim() ||
          el.getAttribute("data-title") ||
          "",
        renderHTML: () => ({}),
      },
      text: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("p")?.textContent?.trim() ||
          el.getAttribute("data-text") ||
          "",
        renderHTML: () => ({}),
      },
      buttonText: {
        default: "Learn More",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("a")?.textContent?.trim() ||
          el.getAttribute("data-button-text") ||
          "",
        renderHTML: () => ({}),
      },
      buttonUrl: {
        default: "/",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("a")?.getAttribute("href") ||
          el.getAttribute("data-button-url") ||
          "/",
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
    return [{ tag: 'section[data-sbt-block="cta"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Build nested semantic HTML from attributes.
    // `HTMLAttributes` carries data-locked / data-lock-reason when set.
    // ProseMirror's DOMOutputSpec supports nested child arrays at runtime,
    // even though the TypeScript type definition is restrictive — cast via any.
    return [
      "section",
      mergeAttributes(
        { "data-sbt-block": "cta", class: "sbt-cta" },
        HTMLAttributes,
      ),
      ["h2", {}, node.attrs.title || ""],
      ["p", {}, node.attrs.text || ""],
      [
        "a",
        { href: node.attrs.buttonUrl || "/", class: "cta-button" },
        node.attrs.buttonText || "Learn More",
      ],
    ] as unknown as [string, Record<string, string>];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTAView);
  },
});
