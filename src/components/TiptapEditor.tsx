/**
 * TiptapEditor – shared rich-text editor component.
 *
 * Accepts and outputs standard HTML, making it compatible with any content
 * pipeline that currently uses raw HTML strings.
 *
 * Used by RichContentField and other shared CMS entry points.
 */

"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { LegacyCtaBlock } from "@/editor/extensions/LegacyCtaBlock";
import { Callout } from "@/editor/extensions/Callout";
import { CTA } from "@/editor/extensions/CTA";
import { ImageBlock } from "@/editor/extensions/ImageBlock";
import { RelatedLinks } from "@/editor/extensions/RelatedLinks";
import { Locking } from "@/editor/extensions/Locking";
import { PreserveAttributes } from "@/editor/extensions/PreserveAttributes";
import {
  RawHtmlBlock,
  unwrapRawHtmlPlaceholders,
} from "@/editor/extensions/RawHtmlBlock";
import { StyleBlock } from "@/editor/extensions/StyleBlock";
import { EditorToolbar } from "@/editor/EditorToolbar";
import type { EditorPolicy } from "@/editor/EditorToolbar";
import { getTiptapScopedStyles } from "@/editor/tiptapScopedStyles";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TiptapEditorProps {
  /** Current HTML content */
  value: string;
  /** Called whenever the content changes – receives the latest HTML string */
  onChange: (html: string) => void;
  /** Placeholder text shown when the editor is empty */
  placeholder?: string;
  /** Minimum editor height in px (default 420) */
  minHeight?: number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** When provided, renders a Save button in the toolbar */
  onSave?: () => Promise<void>;
  /** When provided, renders a Preview button in the toolbar */
  onPreview?: () => void;
  /** Optional policy to restrict which block types / marks can be inserted */
  policy?: EditorPolicy;
  /**
   * When true the toolbar uses `position: sticky` so it stays visible at the
   * top of a scrolling ancestor (e.g. inside a pop-out modal).
   */
  stickyToolbar?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Start writing here…",
  minHeight = 420,
  readOnly = false,
  onSave,
  onPreview,
  policy,
  stickyToolbar = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5] },
        codeBlock: { languageClassPrefix: "language-" },
        // Configured here to avoid duplicate-extension warnings in TipTap v3
        link: {
          openOnClick: false,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      LegacyCtaBlock,
      Image.configure({ inline: false }),
      Callout,
      CTA,
      ImageBlock,
      RelatedLinks,
      Locking,
      StyleBlock,
      // RawHtmlBlock must come before PreserveAttributes so its high-priority
      // parseHTML rules win for tags StarterKit cannot model (section, aside,
      // svg, styled div, etc.).
      RawHtmlBlock,
      PreserveAttributes,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(unwrapRawHtmlPlaceholders(editor.getHTML()));
    },
  });

  // Sync external content changes (e.g. when switching editor modes)
  useEffect(() => {
    if (!editor) return;
    const nextValue = value || "";

    if (unwrapRawHtmlPlaceholders(editor.getHTML()) === nextValue) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return;
      if (unwrapRawHtmlPlaceholders(editor.getHTML()) === nextValue) return;

      editor.commands.setContent(nextValue, { emitUpdate: false });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Sync editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
        // When stickyToolbar: become a flex column so the toolbar stays at
        // the top and only the editor content area scrolls internally.
        // This avoids position:sticky z-index issues entirely.
        ...(stickyToolbar
          ? {
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100dvh - 180px)",
            }
          : {}),
      }}
    >
      {/* Toolbar – static at top; content below scrolls internally when stickyToolbar */}
      {!readOnly && (
        <div
          style={
            stickyToolbar
              ? {
                  flexShrink: 0,
                  borderBottom: "1px solid #dee2e6",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }
              : undefined
          }
        >
          <EditorToolbar
            editor={editor}
            onSave={onSave}
            onPreview={onPreview}
            policy={policy}
          />
        </div>
      )}

      {/* Editor area – scrolls internally when stickyToolbar */}
      <div
        style={
          stickyToolbar
            ? { flex: "1 1 auto", minHeight: 0, overflowY: "auto" }
            : undefined
        }
      >
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
      </div>

      {/* Scoped styles */}
      <style>
        {getTiptapScopedStyles({
          minHeight,
          legacyCtaLabel: "Legacy CTA block",
          includeLegacySelectedBorder: true,
        })}
      </style>
    </div>
  );
}
