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
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { LegacyArticleCtaBlock } from "./extensions/LegacyArticleCtaBlock";
import { Callout } from "./extensions/Callout";
import { CTA } from "./extensions/CTA";
import { ImageBlock } from "./extensions/ImageBlock";
import { Locking } from "./extensions/Locking";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorPolicy } from "./policy";
import { getTiptapScopedStyles } from "./tiptapScopedStyles";

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
      // Legacy block (backward-compat with existing article HTML)
      LegacyArticleCtaBlock,
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
      <style>{getTiptapScopedStyles({ minHeight })}</style>
    </div>
  );
}
