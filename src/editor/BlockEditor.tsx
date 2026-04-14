/**
 * Shared block-based TipTap editor for CMS content.
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
import { LegacyCtaBlock } from "./extensions/LegacyCtaBlock";
import { Callout } from "./extensions/Callout";
import { CTA } from "./extensions/CTA";
import { ImageBlock } from "./extensions/ImageBlock";
import { Locking } from "./extensions/Locking";
import { EditorToolbar } from "./EditorToolbar";
import type { EditorPolicy } from "./policy";
import { getTiptapScopedStyles } from "./tiptapScopedStyles";

export interface BlockEditorOutput {
  json: JSONContent;
  html: string;
}

export interface BlockEditorProps {
  initialJson?: JSONContent | null;
  initialHtml?: string;
  onChange?: (value: BlockEditorOutput) => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
  policy?: EditorPolicy;
  onSave?: () => Promise<void>;
  onPreview?: () => void;
}

export default function BlockEditor({
  initialJson,
  initialHtml,
  onChange,
  placeholder = "Start writing here…",
  minHeight = 420,
  readOnly = false,
  policy,
  onSave,
  onPreview,
}: BlockEditorProps) {
  const initialContent: JSONContent | string | undefined =
    initialJson ?? initialHtml ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5] },
        codeBlock: { languageClassPrefix: "language-" },
        link: {
          openOnClick: false,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      LegacyCtaBlock,
      Callout,
      CTA,
      ImageBlock,
      Locking,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
    ],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate({ editor: activeEditor }) {
      onChange?.({
        json: activeEditor.getJSON(),
        html: activeEditor.getHTML(),
      });
    },
  });

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
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          onSave={onSave ?? (() => Promise.resolve())}
          onPreview={onPreview ?? (() => {})}
          policy={policy}
        />
      )}

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

      <style>{getTiptapScopedStyles({ minHeight })}</style>
    </div>
  );
}
