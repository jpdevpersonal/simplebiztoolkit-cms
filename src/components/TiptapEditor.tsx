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
import { Locking } from "@/editor/extensions/Locking";
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
      Locking,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. when switching editor modes)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
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
      }}
    >
      {/* Toolbar */}
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          onSave={onSave}
          onPreview={onPreview}
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
