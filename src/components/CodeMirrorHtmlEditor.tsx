"use client";

/**
 * VS Code-style HTML editor built on CodeMirror 6 (bundled locally, so no
 * CSP changes are needed). Shares HtmlCodeEditor's props and falls back to
 * it while CodeMirror lazy-loads or if loading fails.
 */

import { useEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import HtmlCodeEditor from "@/components/HtmlCodeEditor";

type CodeMirrorHtmlEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
  maxHeight?: number;
  required?: boolean;
  ariaLabel?: string;
};

const LINE_HEIGHT_PX = 21;

export default function CodeMirrorHtmlEditor(props: CodeMirrorHtmlEditorProps) {
  const {
    value,
    onChange,
    rows = 10,
    maxHeight = 640,
    required = false,
    ariaLabel = "HTML source editor",
  } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const syncingRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;
    let view: EditorView | null = null;

    Promise.all([
      import("codemirror"),
      import("@codemirror/view"),
      import("@codemirror/commands"),
      import("@codemirror/lang-html"),
      import("@codemirror/theme-one-dark"),
    ])
      .then(
        ([
          { basicSetup },
          { EditorView: View, keymap },
          { indentWithTab },
          { html },
          { oneDark },
        ]) => {
          if (cancelled || !hostRef.current) return;

          view = new View({
            doc: valueRef.current,
            parent: hostRef.current,
            extensions: [
              basicSetup,
              keymap.of([indentWithTab]),
              html(),
              oneDark,
              View.lineWrapping,
              View.contentAttributes.of({ "aria-label": ariaLabel }),
              View.theme({
                "&": {
                  maxHeight: `${maxHeight}px`,
                  fontSize: "13px",
                  borderRadius: "8px",
                },
                "&.cm-focused": { outline: "2px solid rgba(72, 189, 130, 0.6)" },
                ".cm-scroller": {
                  overflow: "auto",
                  lineHeight: `${LINE_HEIGHT_PX}px`,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                },
                ".cm-content, .cm-gutter": {
                  minHeight: `${rows * LINE_HEIGHT_PX}px`,
                },
              }),
              View.updateListener.of((update) => {
                if (update.docChanged && !syncingRef.current) {
                  onChangeRef.current(update.state.doc.toString());
                }
              }),
            ],
          });
          viewRef.current = view;
          setReady(true);
        },
      )
      .catch(() => {
        // Keep the built-in fallback editor.
      });

    return () => {
      cancelled = true;
      view?.destroy();
      viewRef.current = null;
    };
    // Editor is created once; later prop changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external changes (Format HTML, mode switches, edits made in the
  // fallback editor while CodeMirror was loading).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    syncingRef.current = true;
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    syncingRef.current = false;
  }, [value, ready]);

  return (
    <div className="admin-code-editor">
      {!ready && (
        <HtmlCodeEditor
          value={value}
          onChange={onChange}
          rows={rows}
          maxHeight={maxHeight}
          required={required}
          ariaLabel={ariaLabel}
        />
      )}
      <div ref={hostRef} hidden={!ready} />
      {ready && (
        <>
          {required && (
            // Keeps native "required" form validation working.
            <textarea
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden="true"
              required
              value={value}
              onChange={() => {}}
            />
          )}
          <p className="admin-code-editor-hint">
            <kbd>Ctrl/⌘ F</kbd> find &amp; replace · <kbd>Ctrl/⌘ D</kbd> select
            next match · <kbd>Alt ↑/↓</kbd> move line · <kbd>Ctrl/⌘ /</kbd>{" "}
            comment · <kbd>Ctrl Space</kbd> suggestions · <kbd>Tab</kbd> indent
          </p>
        </>
      )}
    </div>
  );
}
