/**
 * /admin/demo-locked-blocks – Interactive demo of the Locked Blocks feature.
 *
 * Demonstrates:
 *   • A locked CTA block that cannot be edited, deleted, cut or drag-moved.
 *   • An unlocked Callout block that can be freely edited.
 *   • A normal editable paragraph.
 *   • The toolbar "🔒 Lock / 🔓 Unlock" toggle in action.
 *
 * To access this page navigate to: /admin/demo-locked-blocks
 */

"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import BlockEditor, { type BlockEditorOutput } from "@/editor/BlockEditor";

// ─── Demo initial content ─────────────────────────────────────────────────────

const INITIAL_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Locked Blocks Demo" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "✏️ This paragraph is fully editable. Try typing, deleting, or formatting text here.",
        },
      ],
    },
    {
      // Locked CTA — cannot be edited, deleted, cut, or moved
      type: "ctaSbtBlock",
      attrs: {
        title: "Get Started Today",
        text: "This CTA block is locked. You cannot edit, delete, cut or drag it.",
        buttonText: "Learn More",
        buttonUrl: "/tools",
        locked: true,
        lockReason: "Marketing-approved — do not modify",
      },
    },
    {
      // Locked Callout
      type: "callout",
      attrs: { tone: "warning", locked: true, lockReason: "Legal disclaimer" },
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "⚠️ This callout is also locked. Click it to select it, then press Backspace or Delete — nothing will happen. Use the 🔓 Unlock toolbar button to unlock it.",
            },
          ],
        },
      ],
    },
    {
      // Unlocked Callout — freely editable
      type: "callout",
      attrs: { tone: "success", locked: false, lockReason: null },
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "✅ This callout is unlocked and editable. Click any block then use the 🔒 Lock button in the toolbar to lock it.",
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Another editable paragraph below the locked CTA.",
        },
      ],
    },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LockedBlocksDemoPage() {
  const [output, setOutput] = useState<BlockEditorOutput | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
      <h1
        style={{
          fontSize: "1.625rem",
          fontWeight: 700,
          marginBottom: "0.25rem",
        }}
      >
        Locked Blocks Demo
      </h1>
      <p
        style={{
          color: "#6b7280",
          marginBottom: "1.5rem",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
        }}
      >
        The <strong>CTA</strong> and first <strong>Callout</strong> below are{" "}
        <strong>locked</strong>. Try to type inside them, delete them, or cut
        them — the Locking extension blocks the operation at the ProseMirror
        transaction level. Select any block and use the{" "}
        <strong>🔒 Lock / 🔓 Unlock</strong> button in the toolbar to toggle the
        lock state.
      </p>

      {/* ── How-to box ── */}
      <div
        style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 6,
          padding: "10px 16px",
          marginBottom: "1.25rem",
          fontSize: "0.875rem",
          color: "#0c4a6e",
        }}
      >
        <strong>Things to try:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "1.25rem" }}>
          <li>
            Click inside the locked CTA and press any letter key — no change.
          </li>
          <li>Select the locked CTA and press Backspace / Delete — blocked.</li>
          <li>Try Ctrl+X (cut) on the locked callout — blocked.</li>
          <li>
            Click the unlocked callout, then press <strong>🔒 Lock</strong> in
            the toolbar — it becomes locked.
          </li>
          <li>
            Select a locked block and press <strong>🔓 Unlock</strong> — it
            becomes editable again.
          </li>
        </ul>
      </div>

      <BlockEditor
        initialJson={INITIAL_CONTENT}
        onChange={setOutput}
        minHeight={500}
      />

      {/* ── Output inspector ── */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setShowOutput((v) => !v)}
          style={{
            padding: "5px 14px",
            fontSize: "0.875rem",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {showOutput ? "Hide" : "Show"} exported JSON / HTML
        </button>

        {showOutput && output && (
          <div
            style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
          >
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  marginBottom: 4,
                  color: "#374151",
                }}
              >
                TipTap JSON
              </p>
              <pre
                style={{
                  padding: "0.875rem",
                  background: "#f1f5f9",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  overflow: "auto",
                  maxHeight: 360,
                  border: "1px solid #e2e8f0",
                }}
              >
                {JSON.stringify(output.json, null, 2)}
              </pre>
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  marginBottom: 4,
                  color: "#374151",
                }}
              >
                Serialised HTML (note <code>data-locked</code> attributes)
              </p>
              <pre
                style={{
                  padding: "0.875rem",
                  background: "#f1f5f9",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  overflow: "auto",
                  maxHeight: 360,
                  whiteSpace: "pre-wrap",
                  border: "1px solid #e2e8f0",
                }}
              >
                {output.html}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
