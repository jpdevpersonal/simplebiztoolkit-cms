/**
 * RichContentField
 *
 * A reusable form-field component that wraps a plain-HTML textarea and a
 * Tiptap rich-text editor behind a toggle, so the user can choose which
 * editing experience they prefer.
 *
 * The selected mode is persisted per-field via `storageKey` in localStorage
 * so the preference survives page refreshes.
 *
 * Both modes share the same `value` string (HTML), making it safe to switch
 * between them at any time without losing content.
 */

"use client";

import { useState, useEffect } from "react";
import TiptapEditor from "@/components/TiptapEditor";
import type { EditorPolicy } from "@/editor/EditorToolbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorMode = "html" | "tiptap";

export interface RichContentFieldProps {
  /** Field label rendered above the editor */
  label: string;
  /** Current HTML value */
  value: string;
  /** Called with new HTML whenever the content changes */
  onChange: (html: string) => void;
  /**
   * localStorage key used to remember the user's preferred editor mode for
   * this specific field. Use distinct keys for different fields so their
   * preferences are stored independently (e.g. "product-description-mode").
   */
  storageKey: string;
  /** Whether this field is required (adds * to label, native required attr) */
  required?: boolean;
  /** Number of rows for the HTML textarea (default 10) */
  htmlRows?: number;
  /** Optional hint shown below the editor in HTML mode */
  hint?: React.ReactNode;
  /** Placeholder text shown inside the Tiptap editor when empty */
  placeholder?: string;
  /** Minimum height of the Tiptap editor in px (default 200) */
  minHeight?: number;
  /** When provided, renders a Save button in the Tiptap toolbar */
  onSave?: () => Promise<void>;
  /** When provided, renders a Preview button in the Tiptap toolbar */
  onPreview?: () => void;
  /** Optional policy to restrict which block types / marks are available */
  policy?: EditorPolicy;
}

// ─── Toggle pill ──────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: EditorMode;
  onChange: (m: EditorMode) => void;
}) {
  const base: React.CSSProperties = {
    padding: "4px 12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8125rem",
    transition: "background 0.15s, color 0.15s",
  };
  const active: React.CSSProperties = {
    background: "var(--sb-primary, #0d6efd)",
    color: "#fff",
  };
  const inactive: React.CSSProperties = {
    background: "#fff",
    color: "#495057",
  };

  return (
    <div
      role="group"
      aria-label="Editor mode"
      style={{
        display: "inline-flex",
        border: "1px solid #dee2e6",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => onChange("html")}
        style={{ ...base, ...(mode === "html" ? active : inactive) }}
      >
        HTML
      </button>
      <button
        type="button"
        onClick={() => onChange("tiptap")}
        style={{
          ...base,
          ...(mode === "tiptap" ? active : inactive),
          borderLeft: "1px solid #dee2e6",
        }}
      >
        ✦ Tiptap
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RichContentField({
  label,
  value,
  onChange,
  storageKey,
  required = false,
  htmlRows = 10,
  hint,
  placeholder = "Start writing here…",
  minHeight = 200,
  onSave,
  onPreview,
  policy,
}: RichContentFieldProps) {
  // Always start with "html" so server and client render identically (avoids
  // hydration mismatches). After the component mounts, we restore the stored
  // preference from localStorage.
  const [mode, setMode] = useState<EditorMode>("html");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as EditorMode | null;
      if (saved === "html" || saved === "tiptap") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode(saved);
      }
    } catch {
      // localStorage unavailable (SSR / incognito) – keep default
    }
  }, [storageKey]);

  const handleModeChange = (m: EditorMode) => {
    setMode(m);
    try {
      localStorage.setItem(storageKey, m);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      {/* Label row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <label className="form-label fw-semibold mb-0">
          {label}
          {required && " *"}
        </label>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Editor */}
      {mode === "html" ? (
        <>
          <textarea
            className="form-control"
            rows={htmlRows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
          />
          {hint && (
            <small style={{ color: "var(--sb-muted)", fontSize: "0.8125rem" }}>
              {hint}
            </small>
          )}
        </>
      ) : (
        <>
          <TiptapEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
            onSave={onSave}
            onPreview={onPreview}
            policy={policy}
          />
          {/* Hidden input keeps native form "required" validation working */}
          {required && <input type="hidden" required value={value} />}
          <small
            style={{
              color: "var(--sb-muted)",
              fontSize: "0.8125rem",
              marginTop: "0.25rem",
              display: "block",
            }}
          >
            Rich-text editor — content is saved as HTML.
          </small>
        </>
      )}
    </div>
  );
}
