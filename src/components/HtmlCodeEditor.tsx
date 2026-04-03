"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

type HtmlCodeEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  rows?: number;
  required?: boolean;
  ariaLabel?: string;
};

type HtmlToken =
  | { type: "text"; value: string }
  | { type: "tag"; value: string }
  | { type: "comment"; value: string };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tokenizeHtml(value: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let lastIndex = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({
        type: "text",
        value: value.slice(lastIndex, index),
      });
    }

    tokens.push({
      type: token.startsWith("<!--") ? "comment" : "tag",
      value: token,
    });

    lastIndex = index + token.length;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: "text", value: value.slice(lastIndex) });
  }

  return tokens;
}

function highlightAttributes(rawAttributes: string) {
  if (!rawAttributes) {
    return "";
  }

  const attributePattern =
    /(\s+)([^\s=/>]+)(?:((?:\s*=\s*)(?:\"[^\"]*\"|'[^']*'|[^\s\"'=<>`]+)))?/g;

  let markup = "";
  let lastIndex = 0;

  for (const match of rawAttributes.matchAll(attributePattern)) {
    const [segment, leadingWhitespace, attributeName, valueSegment = ""] =
      match;
    const index = match.index ?? 0;
    markup += escapeHtml(rawAttributes.slice(lastIndex, index));
    markup += escapeHtml(leadingWhitespace);
    markup += `<span class="sb-html-editor__attr-name">${escapeHtml(attributeName)}</span>`;

    if (valueSegment) {
      const equalSignIndex = valueSegment.indexOf("=");
      const spacingAndEqual =
        equalSignIndex >= 0 ? valueSegment.slice(0, equalSignIndex + 1) : "";
      const attributeValue =
        equalSignIndex >= 0
          ? valueSegment.slice(equalSignIndex + 1)
          : valueSegment;

      markup += `<span class="sb-html-editor__operator">${escapeHtml(spacingAndEqual)}</span>`;
      markup += `<span class="sb-html-editor__attr-value">${escapeHtml(attributeValue)}</span>`;
    }

    lastIndex = index + segment.length;
  }

  markup += escapeHtml(rawAttributes.slice(lastIndex));
  return markup;
}

function highlightTag(token: string) {
  const match = token.match(/^<(\/)?([A-Za-z][\w:-]*)([\s\S]*?)(\/?)>$/);
  if (!match) {
    return `<span class="sb-html-editor__tag">${escapeHtml(token)}</span>`;
  }

  const [
    ,
    closingSlash = "",
    tagName,
    rawAttributes = "",
    selfClosingSlash = "",
  ] = match;

  return [
    `<span class="sb-html-editor__tag-angle">&lt;${escapeHtml(closingSlash)}</span>`,
    `<span class="sb-html-editor__tag-name">${escapeHtml(tagName)}</span>`,
    highlightAttributes(rawAttributes),
    selfClosingSlash
      ? `<span class="sb-html-editor__tag-angle">${escapeHtml(selfClosingSlash)}</span>`
      : "",
    '<span class="sb-html-editor__tag-angle">&gt;</span>',
  ].join("");
}

function highlightHtml(value: string) {
  return tokenizeHtml(value)
    .map((token) => {
      if (token.type === "comment") {
        return `<span class="sb-html-editor__comment">${escapeHtml(token.value)}</span>`;
      }

      if (token.type === "tag") {
        return highlightTag(token.value);
      }

      return `<span class="sb-html-editor__text">${escapeHtml(token.value)}</span>`;
    })
    .join("");
}

export default function HtmlCodeEditor({
  value,
  onChange,
  rows = 10,
  required = false,
  ariaLabel = "HTML source editor",
}: HtmlCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightContentRef = useRef<HTMLPreElement>(null);
  const horizontalScrollbarRef = useRef<HTMLDivElement>(null);
  const actualLines = value.split("\n");
  const lineCount = value.trim() ? Math.max(actualLines.length, 1) : rows;
  const longestLineLength = actualLines.reduce(
    (maxLength, line) => Math.max(maxLength, line.length),
    0,
  );
  const editorContentWidth = `calc(${Math.max(longestLineLength + 2, 1)}ch + 2rem)`;
  const highlightedMarkup = useMemo(
    () =>
      `${highlightHtml(value || "")}<span class="sb-html-editor__newline">\n</span>`,
    [value],
  );

  const syncHorizontalPosition = (
    scrollLeft: number,
    source: "textarea" | "scrollbar",
  ) => {
    const textarea = textareaRef.current;
    const scrollbar = horizontalScrollbarRef.current;

    if (highlightContentRef.current) {
      highlightContentRef.current.style.transform = `translateX(${-scrollLeft}px)`;
    }

    if (
      source !== "textarea" &&
      textarea &&
      textarea.scrollLeft !== scrollLeft
    ) {
      textarea.scrollLeft = scrollLeft;
    }

    if (
      source !== "scrollbar" &&
      scrollbar &&
      scrollbar.scrollLeft !== scrollLeft
    ) {
      scrollbar.scrollLeft = scrollLeft;
    }
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const minimumHeight = value.trim() ? 0 : 168;
    textarea.style.height = `${Math.max(textarea.scrollHeight, minimumHeight)}px`;
  }, [value]);

  useEffect(() => {
    const scrollLeft = textareaRef.current?.scrollLeft ?? 0;
    syncHorizontalPosition(scrollLeft, "textarea");
  }, [editorContentWidth, value]);

  const handleTextareaScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    syncHorizontalPosition(event.currentTarget.scrollLeft, "textarea");
  };

  const handleHorizontalScrollbarScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    syncHorizontalPosition(event.currentTarget.scrollLeft, "scrollbar");
  };

  return (
    <div
      data-testid="html-code-editor"
      style={{
        border: "1px solid #2d2d30",
        borderRadius: 10,
        overflow: "hidden",
        background: "#1e1e1e",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.55rem 0.8rem",
          borderBottom: "1px solid #2d2d30",
          background:
            "linear-gradient(180deg, rgba(37,37,38,0.98) 0%, rgba(30,30,30,0.98) 100%)",
          color: "#cccccc",
          fontSize: "0.75rem",
          letterSpacing: "0.01em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#ff5f56",
              boxShadow: "14px 0 0 #ffbd2e, 28px 0 0 #27c93f",
              marginRight: 28,
            }}
          />
          <span style={{ color: "#e5e7eb", fontWeight: 600 }}>
            page-content.html
          </span>
        </div>
        <span style={{ color: "#8f8f93" }}>HTML source</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px minmax(0, 1fr)",
        }}
      >
        <div
          data-testid="html-code-editor-gutter"
          aria-hidden="true"
          style={{
            overflow: "hidden",
            background: "#181818",
            borderRight: "1px solid #2d2d30",
            color: "#6b7280",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.8125rem",
            lineHeight: 1.65,
            textAlign: "right",
            userSelect: "none",
          }}
        >
          <div
            data-testid="html-code-editor-gutter-content"
            style={{
              padding: "0.9rem 0.65rem",
            }}
          >
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index + 1}>{index + 1}</div>
            ))}
          </div>
        </div>

        <div style={{ position: "relative", minWidth: 0 }}>
          <div
            data-testid="html-code-editor-highlight"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <pre
              ref={highlightContentRef}
              data-testid="html-code-editor-highlight-content"
              style={{
                margin: 0,
                minHeight: "100%",
                padding: "0.9rem 1rem",
                minWidth: "100%",
                width: editorContentWidth,
                color: "#d4d4d4",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.8125rem",
                lineHeight: 1.65,
                whiteSpace: "pre",
                tabSize: 2,
                willChange: "transform",
              }}
              dangerouslySetInnerHTML={{ __html: highlightedMarkup }}
            />
          </div>

          <textarea
            ref={textareaRef}
            data-testid="html-code-editor-textarea"
            aria-label={ariaLabel}
            className="sb-html-editor__textarea"
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={handleTextareaScroll}
            required={required}
            spellCheck={false}
            wrap="off"
            style={{
              position: "relative",
              zIndex: 1,
              display: "block",
              minWidth: "100%",
              width: editorContentWidth,
              padding: "0.9rem 1rem",
              border: "none",
              background: "transparent",
              color: "transparent",
              caretColor: "#ffffff",
              resize: "none",
              overflowX: "scroll",
              overflowY: "hidden",
              outline: "none",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.8125rem",
              lineHeight: 1.65,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px minmax(0, 1fr)",
          borderTop: "1px solid #2d2d30",
          background: "#181818",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            borderRight: "1px solid #2d2d30",
            background: "#181818",
          }}
        />
        <div
          ref={horizontalScrollbarRef}
          data-testid="html-code-editor-horizontal-scrollbar"
          onScroll={handleHorizontalScrollbarScroll}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            height: 16,
            background: "#1e1e1e",
          }}
        >
          <div
            data-testid="html-code-editor-horizontal-scrollbar-spacer"
            style={{
              minWidth: "100%",
              width: editorContentWidth,
              height: 1,
            }}
          />
        </div>
      </div>

      <style>{`
        .sb-html-editor__textarea {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sb-html-editor__textarea::selection {
          background: rgba(38, 79, 120, 0.65);
        }

        .sb-html-editor__tag-angle {
          color: #808080;
        }

        .sb-html-editor__tag-name {
          color: #569cd6;
        }

        .sb-html-editor__attr-name {
          color: #9cdcfe;
        }

        .sb-html-editor__attr-value {
          color: #ce9178;
        }

        .sb-html-editor__operator {
          color: #d4d4d4;
        }

        .sb-html-editor__comment {
          color: #6a9955;
        }

        .sb-html-editor__text {
          color: #d4d4d4;
        }

        .sb-html-editor__tag {
          color: #d4d4d4;
        }

        .sb-html-editor__newline {
          color: transparent;
        }

        .sb-html-editor__textarea::-webkit-scrollbar {
          display: none;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"] {
          scrollbar-color: #4f4f4f #1e1e1e;
          scrollbar-width: thin;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"]::-webkit-scrollbar {
          height: 14px;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"]::-webkit-scrollbar-track {
          background: #1e1e1e;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"]::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 999px;
          border: 2px solid #1e1e1e;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"]::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }
      `}</style>
    </div>
  );
}
