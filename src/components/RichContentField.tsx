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
import HtmlCodeEditor from "@/components/HtmlCodeEditor";
import TiptapEditor from "@/components/TiptapEditor";
import type { EditorPolicy } from "@/editor/EditorToolbar";
import { formatHtmlForEditing } from "@/lib/htmlFormatter";

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
  /** Enables readable HTML formatting controls in HTML mode */
  enableHtmlFormatting?: boolean;
  /** Auto-formats the HTML when switching from Tiptap into HTML mode */
  formatHtmlOnModeSwitch?: boolean;
  /** Visual treatment for the HTML editor */
  htmlEditorVariant?: "plain" | "code";
  /**
   * When provided, a pop-out icon button is rendered in the label controls
   * row and calls this handler when clicked. Use this to open the editor in
   * a full-screen modal.
   */
  onPopOut?: () => void;
  /**
   * When true, the Tiptap toolbar becomes sticky so it stays visible at the
   * top of a scrolling ancestor (e.g. a pop-out modal body).
   */
  stickyToolbar?: boolean;
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
  enableHtmlFormatting = false,
  formatHtmlOnModeSwitch = false,
  htmlEditorVariant = "plain",
  onPopOut,
  stickyToolbar = false,
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

  const applyFormattedHtml = () => {
    if (!enableHtmlFormatting) return;

    const formatted = formatHtmlForEditing(value);
    if (formatted && formatted !== value) {
      onChange(formatted);
    }
  };

  const handleModeChange = (m: EditorMode) => {
    const previousMode = mode;
    setMode(m);
    try {
      localStorage.setItem(storageKey, m);
    } catch {
      // ignore
    }

    if (
      enableHtmlFormatting &&
      formatHtmlOnModeSwitch &&
      previousMode === "tiptap" &&
      m === "html"
    ) {
      const formatted = formatHtmlForEditing(value);
      if (formatted && formatted !== value) {
        onChange(formatted);
      }
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {mode === "html" && enableHtmlFormatting && (
            <button
              type="button"
              onClick={applyFormattedHtml}
              disabled={!value.trim()}
              className="btn btn-sm btn-outline-secondary"
            >
              Format HTML
            </button>
          )}
          <ModeToggle mode={mode} onChange={handleModeChange} />
          {onPopOut && (
            <button
              type="button"
              className="rich-content-popout-btn"
              onClick={onPopOut}
              title="Open in full-screen editor"
              aria-label="Open editor in full screen"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      {mode === "html" ? (
        <>
          {htmlEditorVariant === "code" ? (
            <HtmlCodeEditor
              value={value}
              onChange={onChange}
              rows={htmlRows}
              required={required}
              ariaLabel={label || "HTML source editor"}
            />
          ) : (
            <textarea
              className="form-control"
              rows={htmlRows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              spellCheck={false}
              wrap="off"
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.8125rem",
                lineHeight: 1.65,
                tabSize: 2,
              }}
            />
          )}
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
            stickyToolbar={stickyToolbar}
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
