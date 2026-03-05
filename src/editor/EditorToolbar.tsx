/**
 * EditorToolbar – Full CMS-style toolbar for the TipTap block editor.
 *
 * Sections (left → right):
 *   1. History   – Undo / Redo
 *   2. Style     – Heading select
 *   3. Marks     – Bold / Italic / Underline / Strike / Code (policy-gated)
 *   4. Align     – Left / Center / Right
 *   5. Lists     – Bullet / Ordered (policy-gated)
 *   6. Blocks    – Blockquote / Code Block / Horizontal Rule (policy-gated)
 *   7. Link      – Insert / edit link (policy-gated)
 *   8. Insert    – "Insert Block" dropdown (Paragraph, Callout, CTA, Image)
 *   9. Selected  – Duplicate / Delete / Move Up / Move Down
 *  10. Lock      – 🔒 Lock / 🔓 Unlock
 *  11. Utilities – ¶ Split / ✕ fmt
 *  12. Actions   – (spacer) Preview / Save   ← right-aligned
 */

// Note: no "use client" here – this component is always rendered inside
// ArticleEditor.tsx which already declares "use client", so the directive is
// inherited and the Next.js "serializable props" lint check is avoided.

import React, { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { isSelectionInLockedNode } from "./extensions/Locking";
import type { EditorControlPreset } from "@/types/editorControls";
import { clientApi } from "@/lib/clientApi";
import {
  canMoveBlockDown,
  canMoveBlockUp,
  deleteBlock,
  duplicateBlock,
  getTopLevelBlock,
  moveBlockDown,
  moveBlockUp,
} from "./blockSelection";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditorPolicy {
  allowedNodes: string[];
  allowedMarks: string[];
}

// ─── Primitive toolbar widgets ────────────────────────────────────────────────

type TBtnProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  /** When true renders with a subtle danger colour on hover */
  danger?: boolean;
};

function TBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
  danger = false,
}: TBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 30,
        height: 28,
        padding: "0 6px",
        border: "1px solid",
        borderColor: active
          ? "var(--sb-primary, #0d6efd)"
          : danger
            ? "#f1aeb5"
            : "#dee2e6",
        borderRadius: 4,
        background: active
          ? "var(--sb-primary, #0d6efd)"
          : danger
            ? "#fff1f3"
            : "#fff",
        color: active ? "#fff" : danger ? "#842029" : "#212529",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: "0.8125rem",
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        userSelect: "none",
        transition: "background 0.12s, border-color 0.12s, color 0.12s",
      }}
    >
      {children}
    </button>
  );
}

function TDivider() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 1,
        height: 20,
        background: "#dee2e6",
        margin: "0 3px",
        alignSelf: "center",
        flexShrink: 0,
      }}
    />
  );
}

const selectStyle: React.CSSProperties = {
  height: 28,
  padding: "0 6px",
  fontSize: "0.8125rem",
  border: "1px solid #dee2e6",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
  color: "#212529",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function EditorToolbar({
  editor,
  onSave,
  onPreview,
  policy,
}: {
  editor: Editor | null;
  /** When provided, renders a Save button on the right side of the toolbar. */
  onSave?: () => Promise<void>;
  /** When provided, renders a Preview button on the right side of the toolbar. */
  onPreview?: () => void;
  policy?: EditorPolicy;
}) {
  // Force re-render whenever the editor updates its state so that active/
  // disabled states stay in sync with the document and selection.
  const [, forceUpdate] = useState(0);
  const [saving, setSaving] = useState(false);
  // Controlled value for the Insert Block dropdown – reset to "" after pick.
  const [insertValue, setInsertValue] = useState("");
  // Approved editor control presets loaded from the API.
  const [presets, setPresets] = useState<EditorControlPreset[]>([]);

  useEffect(() => {
    clientApi
      .getEditorControls("approved")
      .then(setPresets)
      .catch(() => {
        /* silent – presets are optional */
      });
  }, []);

  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate((n) => n + 1);
    editor.on("update", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("update", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);

  const isNodeAllowed = useCallback(
    (name: string) => !policy || policy.allowedNodes.includes(name),
    [policy],
  );
  const isMarkAllowed = useCallback(
    (name: string) => !policy || policy.allowedMarks.includes(name),
    [policy],
  );

  if (!editor) return null;

  const { state } = editor;
  const block = getTopLevelBlock(state);
  const blockIsLocked = block?.node.attrs?.locked === true;
  const hasBlock = block !== null;
  const upOk = canMoveBlockUp(state);
  const downOk = canMoveBlockDown(state);
  const hasSelection = !state.selection.empty;

  // ── Link ──────────────────────────────────────────────────────────────────

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev ?? "https://");
    if (url === null) return;
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

  // ── Insert Block helpers ──────────────────────────────────────────────────

  const insertCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "callout",
        attrs: { tone: "info" },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Your message here…" }],
          },
        ],
      })
      .run();
  };

  const insertCTA = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "ctaSbtBlock",
        attrs: {
          title: "Start Growing Your Business",
          text: "Use the tools in SimpleBizToolkit.",
          buttonText: "Try Now",
          buttonUrl: "/",
        },
      })
      .run();
  };

  const insertImageBlock = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "imageBlock",
        attrs: { src: "", alt: "", caption: "" },
      })
      .run();
  };

  const insertPresetBlock = (preset: EditorControlPreset) => {
    switch (preset.blockType) {
      case "paragraph":
        editor.chain().focus().insertContent({ type: "paragraph" }).run();
        break;
      case "callout":
        editor
          .chain()
          .focus()
          .insertContent({
            type: "callout",
            attrs: { tone: preset.calloutTone ?? "info" },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Your message here…" }],
              },
            ],
          })
          .run();
        break;
      case "cta":
        editor
          .chain()
          .focus()
          .insertContent({
            type: "ctaSbtBlock",
            attrs: {
              title: preset.ctaTitle || "Start Growing Your Business",
              text: preset.ctaText || "Use the tools in SimpleBizToolkit.",
              buttonText: preset.ctaButtonText || "Try Now",
              buttonUrl: preset.ctaButtonUrl || "/",
            },
          })
          .run();
        break;
      case "image":
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageBlock",
            attrs: {
              src: preset.imageSrc || "",
              alt: preset.imageAlt || "",
              caption: preset.imageCaption || "",
            },
          })
          .run();
        break;
    }
  };

  const handleInsertBlock = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setInsertValue(""); // reset immediately to show placeholder again
    if (!val) return;

    // Handle preset selections (value = "preset:<id>")
    if (val.startsWith("preset:")) {
      const presetId = val.slice("preset:".length);
      const preset = presets.find((p) => p.id === presetId);
      if (preset) insertPresetBlock(preset);
      return;
    }

    switch (val) {
      case "paragraph":
        editor.chain().focus().insertContent({ type: "paragraph" }).run();
        break;
      case "callout":
        insertCallout();
        break;
      case "cta":
        insertCTA();
        break;
      case "image":
        insertImageBlock();
        break;
    }
  };

  // ── Block controls ────────────────────────────────────────────────────────

  const handleDuplicate = () => {
    duplicateBlock(state, editor.view.dispatch);
    editor.commands.focus();
  };

  const handleDeleteBlock = () => {
    if (blockIsLocked) return;
    if (!window.confirm("Delete this block?")) return;
    deleteBlock(state, editor.view.dispatch);
    editor.commands.focus();
  };

  const handleMoveUp = () => {
    moveBlockUp(state, editor.view.dispatch);
    editor.commands.focus();
  };

  const handleMoveDown = () => {
    moveBlockDown(state, editor.view.dispatch);
    editor.commands.focus();
  };

  // ── Lock / Unlock ─────────────────────────────────────────────────────────

  const handleLockToggle = () => {
    if (!blockIsLocked) {
      const raw = window.prompt("Lock reason (optional):");
      const reason = raw !== null && raw.trim() !== "" ? raw.trim() : undefined;
      editor.chain().focus().lockBlock(reason).run();
    } else {
      editor.chain().focus().unlockBlock().run();
    }
  };

  // ── Auto-format ───────────────────────────────────────────────────────────

  const autoFormatParagraphs = () => {
    const { from, to, empty } = state.selection;
    if (empty) return;
    if (isSelectionInLockedNode(state)) return;
    const selectedText = state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;
    const sentences = selectedText
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sentences.length === 0) return;
    const paragraphNodes = sentences.map((sentence) => ({
      type: "paragraph",
      content: [{ type: "text", text: sentence + "." }],
    }));
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, paragraphNodes)
      .run();
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  // ── Toolbar heading value (derived, no state) ─────────────────────────────

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : editor.isActive("heading", { level: 5 })
            ? "h5"
            : "p";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        padding: "5px 8px",
        borderBottom: "1px solid #dee2e6",
        background: "#f8f9fa",
      }}
    >
      {/* ── 1. History ── */}
      <TBtn
        title="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↩
      </TBtn>
      <TBtn
        title="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↪
      </TBtn>

      <TDivider />

      {/* ── 2. Paragraph style ── */}
      <select
        title="Paragraph style"
        value={headingValue}
        style={selectStyle}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "p") {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = parseInt(val.replace("h", "")) as 1 | 2 | 3 | 4 | 5;
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
      >
        <option value="p">Paragraph</option>
        {isNodeAllowed("heading") && (
          <>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
          </>
        )}
      </select>

      <TDivider />

      {/* ── 3. Inline marks ── */}
      {isMarkAllowed("bold") && (
        <TBtn
          title="Bold (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </TBtn>
      )}
      {isMarkAllowed("italic") && (
        <TBtn
          title="Italic (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </TBtn>
      )}
      {isMarkAllowed("underline") && (
        <TBtn
          title="Underline (Ctrl+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </TBtn>
      )}
      {isMarkAllowed("strike") && (
        <TBtn
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </TBtn>
      )}
      {isMarkAllowed("code") && (
        <TBtn
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          {"<>"}
        </TBtn>
      )}

      <TDivider />

      {/* ── 4. Text alignment ── */}
      <TBtn
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ≡L
      </TBtn>
      <TBtn
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ≡C
      </TBtn>
      <TBtn
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        ≡R
      </TBtn>

      <TDivider />

      {/* ── 5. Lists ── */}
      {isNodeAllowed("bulletList") && (
        <TBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • —
        </TBtn>
      )}
      {isNodeAllowed("orderedList") && (
        <TBtn
          title="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. —
        </TBtn>
      )}

      <TDivider />

      {/* ── 6. Standard block types ── */}
      {isNodeAllowed("blockquote") && (
        <TBtn
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </TBtn>
      )}
      {isNodeAllowed("codeBlock") && (
        <TBtn
          title="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"{ }"}
        </TBtn>
      )}
      {isNodeAllowed("horizontalRule") && (
        <TBtn
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          —
        </TBtn>
      )}

      {/* ── 7. Link ── */}
      {isMarkAllowed("link") && (
        <TBtn
          title="Insert / edit link"
          active={editor.isActive("link")}
          onClick={addLink}
        >
          🔗
        </TBtn>
      )}

      <TDivider />

      {/* ── 8. Insert Block dropdown ── */}
      <select
        title="Insert a content block"
        value={insertValue}
        style={{ ...selectStyle, fontWeight: 600 }}
        onChange={handleInsertBlock}
      >
        <option value="" disabled>
          + Insert Block
        </option>
        <option value="paragraph">¶ Paragraph</option>
        {isNodeAllowed("callout") && (
          <option value="callout">💬 Callout</option>
        )}
        {isNodeAllowed("ctaSbtBlock") && <option value="cta">📣 CTA</option>}
        {isNodeAllowed("imageBlock") && <option value="image">🖼️ Image</option>}
        {presets.length > 0 && (
          <optgroup label="── Presets">
            {presets.map((p) => (
              <option key={p.id} value={`preset:${p.id}`}>
                ✦ {p.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <TDivider />

      {/* ── 9. Selected block controls ── */}
      <TBtn
        title="Move selected block up"
        disabled={!upOk || blockIsLocked}
        onClick={handleMoveUp}
      >
        ↑ Up
      </TBtn>
      <TBtn
        title="Move selected block down"
        disabled={!downOk || blockIsLocked}
        onClick={handleMoveDown}
      >
        ↓ Dn
      </TBtn>
      <TBtn
        title="Duplicate selected block"
        disabled={!hasBlock}
        onClick={handleDuplicate}
      >
        ⧉ Dup
      </TBtn>
      <TBtn
        title="Delete selected block"
        disabled={!hasBlock || blockIsLocked}
        danger
        onClick={handleDeleteBlock}
      >
        ✕ Del
      </TBtn>

      <TDivider />

      {/* ── 10. Lock / Unlock ── */}
      <TBtn
        title={
          blockIsLocked
            ? "Unlock this block so it can be edited"
            : "Lock this block to prevent edits"
        }
        active={blockIsLocked}
        disabled={!hasBlock}
        onClick={handleLockToggle}
      >
        {blockIsLocked ? "🔓 Unlock" : "🔒 Lock"}
      </TBtn>

      <TDivider />

      {/* ── 11. Utilities ── */}
      <TBtn
        title="Split selection into separate paragraphs at each full stop"
        disabled={!hasSelection}
        onClick={autoFormatParagraphs}
      >
        ¶ Split
      </TBtn>
      <TBtn
        title="Clear all formatting"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      >
        ✕ fmt
      </TBtn>

      {/* Spacer + right-aligned action buttons (only rendered when provided) */}
      {(onPreview || onSave) && <span style={{ flex: 1 }} />}

      {onPreview && (
        <TBtn title="Open a preview of this content" onClick={onPreview}>
          👁 Preview
        </TBtn>
      )}
      {onSave && (
        <TBtn
          title="Save"
          disabled={saving}
          onClick={() => void handleSave()}
          active={false}
        >
          {saving ? "Saving…" : "💾 Save"}
        </TBtn>
      )}
    </div>
  );
}
