/**
 * RawHtmlBlock
 *
 * Tiptap atom node that losslessly round-trips arbitrary block-level HTML
 * that StarterKit's default schema cannot model (`<section>`, `<aside>`,
 * `<svg>`, layout `<div style>`, etc.).
 *
 * Strategy:
 *  - On parse, capture the element's full `outerHTML` into a `html` attribute.
 *  - On serialise, emit a placeholder `<div data-raw-html-block data-html="…">`
 *    with the original HTML URI-encoded into the `data-html` attribute. The
 *    consumer (`TiptapEditor.serialize`) post-processes the output and swaps
 *    the placeholder back to the verbatim HTML so saves are byte-identical.
 *  - Inside the editor a React node view renders the HTML via
 *    `dangerouslySetInnerHTML` so authors see their styled markup live, with
 *    a small hover toolbar (badge / copy / delete) for management.
 *
 * The block is atomic and non-editable in Tiptap; tweaks happen in HTML view.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useState } from "react";

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Block-level tags StarterKit cannot model. Each becomes a RawHtmlBlock.
 * `div` is handled separately (only when it carries inline styling) so
 * simple wrapper divs don't get opaqued unnecessarily.
 */
const BLOCK_TAGS = [
  "section",
  "aside",
  "header",
  "footer",
  "nav",
  "article",
  "figure",
  "svg",
  "details",
  "dialog",
  "form",
  "fieldset",
  "table",
] as const;

const PLACEHOLDER_ATTR = "data-raw-html-block";
const PLACEHOLDER_HTML_ATTR = "data-html";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encodeHtml(html: string): string {
  // encodeURIComponent escapes everything that would be unsafe inside an
  // attribute value (quotes, `<`, `>`, `&`). The decoded form is exact.
  return encodeURIComponent(html);
}

function decodeHtml(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function getTagLabel(html: string): string {
  const match = html.match(/^<\s*([a-zA-Z][a-zA-Z0-9-]*)/);
  return match ? `<${match[1].toLowerCase()}>` : "html";
}

/**
 * Post-process a serialised HTML string from Tiptap, replacing every
 * `<div data-raw-html-block …>` placeholder with the verbatim HTML it
 * represents.
 *
 * Exposed so `TiptapEditor` can call it after `editor.getHTML()`.
 */
export function unwrapRawHtmlPlaceholders(html: string): string {
  if (!html || html.indexOf(PLACEHOLDER_ATTR) === -1) return html;

  if (typeof DOMParser === "undefined") {
    // Server-side / unit-test environment without DOMParser: fall back to a
    // permissive regex that matches both self-closing and full forms.
    return html.replace(
      /<div\b[^>]*\bdata-raw-html-block\b[^>]*>(?:[\s\S]*?<\/div>)?/gi,
      (match) => {
        const m = match.match(/data-html="([^"]*)"/i);
        return m ? decodeHtml(m[1]) : match;
      },
    );
  }

  const doc = new DOMParser().parseFromString(
    `<!DOCTYPE html><html><body>${html}</body></html>`,
    "text/html",
  );
  const placeholders = doc.querySelectorAll(`[${PLACEHOLDER_ATTR}]`);
  placeholders.forEach((node) => {
    const encoded = node.getAttribute(PLACEHOLDER_HTML_ATTR) ?? "";
    const raw = decodeHtml(encoded);
    const template = doc.createElement("template");
    template.innerHTML = raw;
    const parent = node.parentNode;
    if (!parent) return;
    Array.from(template.content.childNodes).forEach((child) => {
      parent.insertBefore(child, node);
    });
    parent.removeChild(node);
  });
  return doc.body.innerHTML;
}

// ─── Node view ────────────────────────────────────────────────────────────────

interface RawHtmlBlockAttrs {
  html: string;
}

function RawHtmlBlockView({ node, editor, deleteNode }: NodeViewProps) {
  const html = (node.attrs as RawHtmlBlockAttrs).html ?? "";
  const [copied, setCopied] = useState(false);
  const isEditable = editor.isEditable;
  const label = getTagLabel(html);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) {
        return;
      }

      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore – clipboard unavailable or write failed
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      data-raw-html-block-view
      contentEditable={false}
      style={{
        position: "relative",
        margin: "0.5rem 0",
        borderRadius: 6,
        border: "1px dashed transparent",
        transition: "border-color .15s ease, background-color .15s ease",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = "rgba(13, 92, 63, 0.35)";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      {isEditable && (
        <div
          contentEditable={false}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 6px",
            background: "rgba(15, 23, 36, 0.85)",
            color: "#fff",
            borderRadius: 999,
            fontSize: "0.7rem",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
            opacity: 0.9,
            userSelect: "none",
          }}
          title="This block can only be edited in HTML view"
        >
          <span style={{ fontWeight: 600 }}>raw {label}</span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              border: "none",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              padding: "0 4px",
              fontSize: "0.7rem",
            }}
          >
            {copied ? "Copied" : "Copy HTML"}
          </button>
          <button
            type="button"
            onClick={() => deleteNode()}
            style={{
              border: "none",
              background: "transparent",
              color: "#ffb4b4",
              cursor: "pointer",
              padding: "0 4px",
              fontSize: "0.7rem",
            }}
            title="Remove this block"
          >
            Delete
          </button>
        </div>
      )}
      <div
        // Render the captured HTML verbatim so authors see their styled
        // markup live. Safe: this content is authored by the same admin who
        // is currently editing it (admin-only surface, not user input).
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </NodeViewWrapper>
  );
}

// ─── Extension ────────────────────────────────────────────────────────────────

export const RawHtmlBlock = Node.create({
  name: "rawHtmlBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      html: {
        default: "",
      },
    };
  },

  parseHTML() {
    const captureOuter = (element: HTMLElement) => ({
      html: element.outerHTML,
    });

    const placeholderRule = {
      tag: `div[${PLACEHOLDER_ATTR}]`,
      priority: 110,
      getAttrs: (element: HTMLElement) => {
        if (!(element instanceof HTMLElement)) return false;
        const encoded = element.getAttribute(PLACEHOLDER_HTML_ATTR);
        if (encoded == null) return false;
        return { html: decodeHtml(encoded) };
      },
    };

    const tagRules = BLOCK_TAGS.map((tag) => ({
      tag,
      priority: 100,
      getAttrs: (element: HTMLElement) => {
        if (!(element instanceof HTMLElement)) return false;
        return captureOuter(element);
      },
    }));

    const styledDivRule = {
      tag: "div",
      priority: 100,
      getAttrs: (element: HTMLElement) => {
        if (!(element instanceof HTMLElement)) return false;
        // Only capture divs that carry visual/layout styling. Bare
        // structural wrappers (`<div class="row">`) are left to fall
        // through and have their children parsed normally.
        const hasStyle =
          element.hasAttribute("style") &&
          (element.getAttribute("style") ?? "").trim() !== "";
        if (!hasStyle) return false;
        return captureOuter(element);
      },
    };

    return [placeholderRule, ...tagRules, styledDivRule];
  },

  renderHTML({ node, HTMLAttributes }) {
    const html = (node.attrs as RawHtmlBlockAttrs).html ?? "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        [PLACEHOLDER_ATTR]: "true",
        [PLACEHOLDER_HTML_ATTR]: encodeHtml(html),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RawHtmlBlockView);
  },
});

export default RawHtmlBlock;
