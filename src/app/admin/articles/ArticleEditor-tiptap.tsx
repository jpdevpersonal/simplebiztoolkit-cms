/**
 * ArticleEditor-tiptap
 * Tiptap rich-text editor for creating / editing articles.
 * Outputs and accepts standard HTML so it is fully compatible with
 * the existing article content pipeline.
 */

"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArticleEditorTiptapProps {
  /** Current HTML content */
  value: string;
  /** Called whenever the content changes – receives the latest HTML */
  onChange: (html: string) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

// ─── Toolbar button helper ────────────────────────────────────────────────────

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 30,
        height: 30,
        padding: "0 6px",
        border: "1px solid",
        borderColor: active ? "var(--sb-primary, #0d6efd)" : "#dee2e6",
        borderRadius: 4,
        background: active ? "var(--sb-primary, #0d6efd)" : "#fff",
        color: active ? "#fff" : "#212529",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontSize: "0.8125rem",
        fontWeight: 600,
        lineHeight: 1,
        transition: "background 0.15s, border-color 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Toolbar divider ──────────────────────────────────────────────────────────

function ToolbarDivider() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 1,
        height: 22,
        background: "#dee2e6",
        margin: "0 4px",
        alignSelf: "center",
      }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArticleEditorTiptap({
  value,
  onChange,
  readOnly = false,
}: ArticleEditorTiptapProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "Start writing your article content here…",
      }),
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

  // Keep external content in sync (e.g. when switching editors)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Keep editable state in sync
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) return null;

  // ── Toolbar actions ──────────────────────────────────────────────────────

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div
      style={{
        border: "1px solid #dee2e6",
        borderRadius: 6,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderBottom: "1px solid #dee2e6",
            background: "#f8f9fa",
          }}
        >
          {/* History */}
          <ToolbarButton
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            ↩
          </ToolbarButton>
          <ToolbarButton
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            ↪
          </ToolbarButton>

          <ToolbarDivider />

          {/* Heading select */}
          <select
            title="Paragraph style"
            value={
              editor.isActive("heading", { level: 1 })
                ? "h1"
                : editor.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor.isActive("heading", { level: 3 })
                    ? "h3"
                    : editor.isActive("heading", { level: 4 })
                      ? "h4"
                      : "p"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "p") {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(val.replace("h", "")) as 1 | 2 | 3 | 4;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            style={{
              height: 30,
              padding: "0 6px",
              fontSize: "0.8125rem",
              border: "1px solid #dee2e6",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>

          <ToolbarDivider />

          {/* Inline marks */}
          <ToolbarButton
            title="Bold (Ctrl+B)"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            title="Italic (Ctrl+I)"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            title="Underline (Ctrl+U)"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </ToolbarButton>
          <ToolbarButton
            title="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            {"<>"}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text alignment */}
          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            ≡L
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            ≡C
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            ≡R
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • —
          </ToolbarButton>
          <ToolbarButton
            title="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. —
          </ToolbarButton>

          <ToolbarDivider />

          {/* Blocks */}
          <ToolbarButton
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            ❝
          </ToolbarButton>
          <ToolbarButton
            title="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            {"{ }"}
          </ToolbarButton>
          <ToolbarButton
            title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            —
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link / Image */}
          <ToolbarButton
            title="Insert / edit link"
            active={editor.isActive("link")}
            onClick={addLink}
          >
            🔗
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={addImage}>
            🖼
          </ToolbarButton>

          <ToolbarDivider />

          {/* Clear formatting */}
          <ToolbarButton
            title="Clear formatting"
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
          >
            ✕ fmt
          </ToolbarButton>
        </div>
      )}

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        style={{
          minHeight: 420,
          padding: "12px 16px",
          fontSize: "0.9375rem",
          lineHeight: 1.7,
          outline: "none",
        }}
      />

      {/* Tiptap editor CSS */}
      <style>{`
        .tiptap {
          outline: none;
          min-height: 420px;
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
        .tiptap pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        .tiptap hr {
          border: none;
          border-top: 2px solid #dee2e6;
          margin: 1.25rem 0;
        }
        .tiptap a { color: var(--sb-primary, #0d6efd); text-decoration: underline; }
        .tiptap img { max-width: 100%; border-radius: 4px; height: auto; }
      `}</style>
    </div>
  );
}
