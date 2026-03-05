/**
 * ArticleEditor – block-based TipTap editor for the CMS admin.
 *
 * Builds on the existing TiptapEditor feature set (full formatting toolbar,
 * CtaBlock for legacy content) and adds three new custom block nodes:
 *   • Callout   – styled info/warning/success boxes
 *   • CTA       – call-to-action section (atomic, attribute-driven)
 *   • ImageBlock – figure/img/figcaption with inline editing
 *
 * On every content change `onChange` is called with both the TipTap JSON
 * document and the serialised HTML string:
 *
 *   { json: editor.getJSON(), html: editor.getHTML() }
 *
 * Either `initialJson` (preferred) or `initialHtml` can be supplied as the
 * opening content; if both are given JSON takes precedence.
 *
 * Pass `onSave` and `onPreview` to enable the Save / Preview buttons in the
 * toolbar (they appear right-aligned).
 */

"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Callout } from "./extensions/Callout";
import { CTA } from "./extensions/CTA";
import { ImageBlock } from "./extensions/ImageBlock";
import { Locking } from "./extensions/Locking";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorPolicy } from "./policy";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockEditorOutput {
  json: JSONContent;
  html: string;
}

export interface ArticleEditorProps {
  /** TipTap JSON document (preferred over initialHtml when available) */
  initialJson?: JSONContent | null;
  /** Fallback HTML content used when no JSON is provided */
  initialHtml?: string;
  /** Called on every content change with the latest JSON + HTML */
  onChange?: (value: BlockEditorOutput) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
  /**
   * Optional allowlist policy. When supplied, toolbar buttons for node/mark
   * types NOT in the lists are hidden, and insertion helpers bail early.
   * Omit (or pass `undefined`) to allow everything.
   */
  policy?: EditorPolicy;
  /**
   * Called when the user presses the "Save" button in the toolbar.
   * Should persist both html and json (available via editor.getHTML() /
   * editor.getJSON() at the time of the call, or derived from onChange).
   */
  onSave?: () => Promise<void>;
  /** Called when the user presses the "Preview" button in the toolbar. */
  onPreview?: () => void;
}

// ─── Legacy CtaBlock (backward-compat with old article content) ───────────────

function parseBooleanAttribute(value?: string | null): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

const LegacyCtaBlock = Node.create({
  name: "ctaBlock",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "section[data-component='article-cta']" }];
  },

  addAttributes() {
    return {
      title: {
        default: "Ready to get started?",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-title"),
        renderHTML: (attributes: { title?: string }) =>
          attributes.title ? { "data-title": attributes.title } : {},
      },
      description: {
        default: "Add a short supporting description.",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-description"),
        renderHTML: (attributes: { description?: string }) =>
          attributes.description
            ? { "data-description": attributes.description }
            : {},
      },
      primaryLabel: {
        default: "Explore",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-primary-label"),
        renderHTML: (attributes: { primaryLabel?: string }) =>
          attributes.primaryLabel
            ? { "data-primary-label": attributes.primaryLabel }
            : {},
      },
      primaryHref: {
        default: "https://example.com",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-primary-href"),
        renderHTML: (attributes: { primaryHref?: string }) =>
          attributes.primaryHref
            ? { "data-primary-href": attributes.primaryHref }
            : {},
      },
      disclosure: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-disclosure"),
        renderHTML: (attributes: { disclosure?: string | null }) =>
          attributes.disclosure
            ? { "data-disclosure": attributes.disclosure }
            : {},
      },
      showHomeLink: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          parseBooleanAttribute(el.getAttribute("data-show-home-link")),
        renderHTML: (attributes: { showHomeLink?: boolean }) => ({
          "data-show-home-link": attributes.showHomeLink ? "true" : "false",
        }),
      },
      showEtsyLink: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          parseBooleanAttribute(el.getAttribute("data-show-etsy-link")),
        renderHTML: (attributes: { showEtsyLink?: boolean }) => ({
          "data-show-etsy-link": attributes.showEtsyLink ? "true" : "false",
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-component": "article-cta",
      }),
    ];
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArticleEditor({
  initialJson,
  initialHtml,
  onChange,
  placeholder = "Start writing here…",
  minHeight = 420,
  readOnly = false,
  policy,
  onSave,
  onPreview,
}: ArticleEditorProps) {
  // Resolve initial content: JSON takes precedence over HTML
  const initialContent: JSONContent | string | undefined =
    initialJson ?? initialHtml ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
        codeBlock: { languageClassPrefix: "language-" },
        // link is configured here to avoid duplicate-extension warnings
        link: {
          openOnClick: false,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      // Underline is not part of StarterKit – must be added explicitly
      Underline,
      // Legacy block (backward-compat with existing article HTML)
      LegacyCtaBlock,
      // New CMS block nodes
      Callout,
      CTA,
      ImageBlock,
      // Locked-block enforcement
      Locking,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor: e }) {
      onChange?.({ json: e.getJSON(), html: e.getHTML() });
    },
  });

  // Sync editable flag whenever readOnly changes
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Toolbar (hidden in readOnly mode) */}
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          onSave={onSave ?? (() => Promise.resolve())}
          onPreview={onPreview ?? (() => {})}
          policy={policy}
        />
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{
          minHeight,
          padding: "12px 16px",
          fontSize: "0.9375rem",
          lineHeight: 1.7,
          outline: "none",
        }}
      />

      {/* Scoped styles */}
      <style>{`
        .tiptap {
          outline: none;
          min-height: ${minHeight}px;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap h2 { font-size: 1.375rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap h3 { font-size: 1.125rem; font-weight: 600; margin: 0.875rem 0 0.375rem; }
        .tiptap h4 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
        .tiptap h5 { font-size: 0.875rem; font-weight: 600; margin: 0.625rem 0 0.2rem; letter-spacing: 0.04em; }
        .tiptap p { margin: 0 0 0.75rem; }
        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 0 0 0.75rem; }
        .tiptap li { margin-bottom: 0.25rem; }
        .tiptap blockquote {
          border-left: 4px solid #dee2e6;
          margin: 0.75rem 0;
          padding: 0.25rem 1rem;
          color: #6c757d;
        }
        .tiptap code {
          background: #f1f3f5;
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 0.875em;
          font-family: monospace;
        }
        .tiptap pre {
          background: #1e1e2e;
          color: #cdd6f4;
          border-radius: 6px;
          padding: 1rem;
          margin: 0 0 0.75rem;
          overflow-x: auto;
          font-size: 0.875rem;
        }
        .tiptap pre code { background: transparent; padding: 0; color: inherit; }
        .tiptap hr { border: none; border-top: 2px solid #dee2e6; margin: 1.25rem 0; }
        .tiptap a { color: var(--sb-primary, #0d6efd); text-decoration: underline; }
        .tiptap img { max-width: 100%; border-radius: 4px; height: auto; }
        /* Legacy CTA block placeholder */
        .tiptap section[data-component="article-cta"] {
          margin: 0.75rem 0;
          border: 1px dashed #adb5bd;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          background: #f8f9fa;
          min-height: 2.25rem;
        }
        .tiptap section[data-component="article-cta"]::before {
          content: "Article CTA block (legacy)";
          font-size: 0.8125rem;
          font-weight: 600;
          color: #495057;
        }
      `}</style>
    </div>
  );
}
