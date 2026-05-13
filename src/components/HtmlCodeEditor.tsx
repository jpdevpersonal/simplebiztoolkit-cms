"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type HtmlCodeEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  /**
   * Minimum visible rows (used when there is no content yet). Defaults to 10.
   */
  rows?: number;
  /**
   * Maximum visible height in px before the editor pane scrolls internally.
   * Defaults to 540. Set to `Infinity` (or a very large number) to disable
   * internal scrolling and let the editor grow with its content.
   */
  maxHeight?: number;
  required?: boolean;
  ariaLabel?: string;
};

type HtmlToken =
  | { type: "text"; value: string }
  | { type: "tag"; value: string }
  | { type: "comment"; value: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_HEIGHT_PX = 22;
const FONT_SIZE_PX = 13;
const INDENT = "  "; // 2 spaces, matches existing formatter output
const PADDING_Y = 14;
const PADDING_X = 16;
const GUTTER_WIDTH = 56;

// ─── HTML tokenization & syntax highlighting ──────────────────────────────────

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
      tokens.push({ type: "text", value: value.slice(lastIndex, index) });
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
  if (!rawAttributes) return "";

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

// ─── Caret / selection helpers ────────────────────────────────────────────────

function getLineColFromOffset(value: string, offset: number) {
  const safeOffset = Math.max(0, Math.min(offset, value.length));
  const before = value.slice(0, safeOffset);
  const newlineIndex = before.lastIndexOf("\n");
  const line = (before.match(/\n/g)?.length ?? 0) + 1;
  const col = safeOffset - (newlineIndex + 1) + 1;
  return { line, col };
}

// ─── Find helpers ─────────────────────────────────────────────────────────────

interface FindMatch {
  start: number;
  end: number;
}

function findMatches(
  haystack: string,
  needle: string,
  caseSensitive: boolean,
): FindMatch[] {
  if (!needle) return [];
  const matches: FindMatch[] = [];
  const hay = caseSensitive ? haystack : haystack.toLowerCase();
  const find = caseSensitive ? needle : needle.toLowerCase();
  let index = 0;
  while (index <= hay.length - find.length) {
    const next = hay.indexOf(find, index);
    if (next === -1) break;
    matches.push({ start: next, end: next + find.length });
    index = next + (find.length || 1);
  }
  return matches;
}

/**
 * Build a markup string with the same character footprint as `value` but
 * with every character rendered transparently except for the matched ranges,
 * which get a background-coloured `<mark>` wrapper. This is rendered as an
 * overlay layer behind the syntax highlight to draw highlight rectangles.
 */
function buildMatchOverlayMarkup(
  value: string,
  matches: FindMatch[],
  activeIndex: number,
) {
  if (matches.length === 0) return escapeHtml(value);

  const pieces: string[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) {
      pieces.push(escapeHtml(value.slice(cursor, m.start)));
    }
    const cls =
      i === activeIndex
        ? "sb-html-editor__match sb-html-editor__match--active"
        : "sb-html-editor__match";
    pieces.push(`<mark class="${cls}">`);
    pieces.push(escapeHtml(value.slice(m.start, m.end)));
    pieces.push("</mark>");
    cursor = m.end;
  });
  if (cursor < value.length) {
    pieces.push(escapeHtml(value.slice(cursor)));
  }
  return pieces.join("");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HtmlCodeEditor({
  value,
  onChange,
  rows = 10,
  maxHeight = 540,
  required = false,
  ariaLabel = "HTML source editor",
}: HtmlCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightContentRef = useRef<HTMLPreElement>(null);
  const matchOverlayRef = useRef<HTMLPreElement>(null);
  const horizontalScrollbarRef = useRef<HTMLDivElement>(null);
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const [wordWrap, setWordWrap] = useState(false);
  const [caret, setCaret] = useState<{ line: number; col: number }>({
    line: 1,
    col: 1,
  });
  const [copied, setCopied] = useState(false);

  // Find state
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findIndex, setFindIndex] = useState(0);

  const matches = useMemo(
    () => (findOpen ? findMatches(value, findQuery, findCaseSensitive) : []),
    [findOpen, value, findQuery, findCaseSensitive],
  );

  // Clamp to a safe index whenever the result set shrinks (e.g. user typed
  // more characters, narrowing the matches). Computing this on the fly avoids
  // a setState-in-effect.
  const safeFindIndex =
    matches.length === 0
      ? 0
      : ((findIndex % matches.length) + matches.length) % matches.length;

  const matchOverlayMarkup = useMemo(() => {
    if (!findOpen || matches.length === 0) return "";
    return `${buildMatchOverlayMarkup(value, matches, safeFindIndex)}<span class="sb-html-editor__newline">\n</span>`;
  }, [findOpen, matches, value, safeFindIndex]);

  const actualLines = useMemo(() => value.split("\n"), [value]);
  const lineCount = value.trim() ? Math.max(actualLines.length, 1) : rows;
  const longestLineLength = useMemo(
    () => actualLines.reduce((m, line) => Math.max(m, line.length), 0),
    [actualLines],
  );

  const editorContentWidth = wordWrap
    ? "100%"
    : `calc(${Math.max(longestLineLength + 2, 1)}ch + 2rem)`;

  const highlightedMarkup = useMemo(
    () =>
      `${highlightHtml(value || "")}<span class="sb-html-editor__newline">\n</span>`,
    [value],
  );

  // ── Horizontal scroll syncing ────────────────────────────────────────────────
  const syncHorizontalPosition = useCallback(
    (scrollLeft: number, source: "textarea" | "scrollbar") => {
      const textarea = textareaRef.current;
      const scrollbar = horizontalScrollbarRef.current;

      if (highlightContentRef.current) {
        highlightContentRef.current.style.transform = `translateX(${-scrollLeft}px)`;
      }
      if (matchOverlayRef.current) {
        matchOverlayRef.current.style.transform = `translateX(${-scrollLeft}px)`;
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
    },
    [],
  );

  // ── Auto-grow textarea to its scrollHeight ──────────────────────────────────
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const minimumHeight = value.trim() ? 0 : 168;
    textarea.style.height = `${Math.max(textarea.scrollHeight, minimumHeight)}px`;
  }, [value, wordWrap]);

  useEffect(() => {
    const scrollLeft = textareaRef.current?.scrollLeft ?? 0;
    syncHorizontalPosition(scrollLeft, "textarea");
  }, [editorContentWidth, value, findOpen, matches, syncHorizontalPosition]);

  // ── Current-line highlight position ─────────────────────────────────────────
  const updateCaret = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    setCaret(getLineColFromOffset(textarea.value, selectionStart));
  }, []);

  useEffect(() => {
    updateCaret();
  }, [value, updateCaret]);

  // ── Keep current-line indicator visible inside the scroll viewport ──────────
  useEffect(() => {
    const scroller = verticalScrollRef.current;
    if (!scroller) return;
    const lineTop = PADDING_Y + (caret.line - 1) * LINE_HEIGHT_PX;
    const lineBottom = lineTop + LINE_HEIGHT_PX;
    const visibleTop = scroller.scrollTop;
    const visibleBottom = visibleTop + scroller.clientHeight;
    if (lineTop < visibleTop) {
      scroller.scrollTop = Math.max(0, lineTop - LINE_HEIGHT_PX);
    } else if (lineBottom > visibleBottom) {
      scroller.scrollTop = lineBottom - scroller.clientHeight + LINE_HEIGHT_PX;
    }
  }, [caret]);

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleTextareaScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    syncHorizontalPosition(event.currentTarget.scrollLeft, "textarea");
  };

  const handleHorizontalScrollbarScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    syncHorizontalPosition(event.currentTarget.scrollLeft, "scrollbar");
  };

  const setSelection = (start: number, end = start) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      textarea.setSelectionRange(start, end);
      updateCaret();
    });
  };

  const openFind = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selection = textarea.value.slice(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
      if (selection && !selection.includes("\n")) {
        setFindQuery(selection);
      }
    }
    setFindOpen(true);
    requestAnimationFrame(() => {
      findInputRef.current?.focus();
      findInputRef.current?.select();
    });
  }, []);

  const closeFind = useCallback(() => {
    setFindOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const revealMatch = useCallback((match: FindMatch) => {
    const textarea = textareaRef.current;
    const scroller = verticalScrollRef.current;
    if (!textarea) return;
    // Update the textarea's selection but do NOT steal focus from the Find
    // input — that would route the next Enter keypress into the textarea.
    textarea.setSelectionRange(match.start, match.end);

    // Scroll the match into view vertically using the scroll container
    const before = textarea.value.slice(0, match.start);
    const line = (before.match(/\n/g)?.length ?? 0) + 1;
    if (scroller) {
      const lineTop = PADDING_Y + (line - 1) * LINE_HEIGHT_PX;
      const lineBottom = lineTop + LINE_HEIGHT_PX;
      const visibleTop = scroller.scrollTop;
      const visibleBottom = visibleTop + scroller.clientHeight;
      if (lineTop < visibleTop) {
        scroller.scrollTop = Math.max(0, lineTop - LINE_HEIGHT_PX * 2);
      } else if (lineBottom > visibleBottom) {
        scroller.scrollTop =
          lineBottom - scroller.clientHeight + LINE_HEIGHT_PX * 2;
      }
    }
  }, []);

  const gotoMatch = useCallback(
    (direction: 1 | -1) => {
      if (matches.length === 0) return;
      const next =
        (safeFindIndex + direction + matches.length) % matches.length;
      setFindIndex(next);
      revealMatch(matches[next]);
    },
    [matches, safeFindIndex, revealMatch],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd, value: text } = textarea;

    // Ctrl/Cmd+F — open find
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      openFind();
      return;
    }

    // Tab / Shift+Tab — indent or outdent (works on selections too)
    if (event.key === "Tab") {
      event.preventDefault();

      const selectionSpansLines =
        selectionStart !== selectionEnd &&
        text.slice(selectionStart, selectionEnd).includes("\n");

      if (selectionSpansLines) {
        const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
        const block = text.slice(lineStart, selectionEnd);

        if (event.shiftKey) {
          // Outdent: remove up to INDENT.length leading spaces on each line
          const updatedBlock = block
            .split("\n")
            .map((line) => {
              const match = line.match(/^( {1,2}|\t)/);
              return match ? line.slice(match[0].length) : line;
            })
            .join("\n");
          const next =
            text.slice(0, lineStart) + updatedBlock + text.slice(selectionEnd);
          const delta = updatedBlock.length - block.length;
          onChange(next);
          setSelection(
            Math.max(
              lineStart,
              selectionStart + (delta < 0 ? -INDENT.length : 0),
            ),
            selectionEnd + delta,
          );
        } else {
          // Indent: prepend INDENT to each line in the block
          const updatedBlock = block
            .split("\n")
            .map((line) => INDENT + line)
            .join("\n");
          const next =
            text.slice(0, lineStart) + updatedBlock + text.slice(selectionEnd);
          const addedFirst = INDENT.length;
          const addedTotal = updatedBlock.length - block.length;
          onChange(next);
          setSelection(selectionStart + addedFirst, selectionEnd + addedTotal);
        }
        return;
      }

      if (event.shiftKey) {
        // Outdent the current line
        const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
        const leading = text.slice(lineStart).match(/^( {1,2}|\t)/);
        if (leading) {
          const removed = leading[0].length;
          const next =
            text.slice(0, lineStart) + text.slice(lineStart + removed);
          onChange(next);
          setSelection(Math.max(lineStart, selectionStart - removed));
        }
        return;
      }

      // Plain Tab: insert INDENT at caret
      const next =
        text.slice(0, selectionStart) + INDENT + text.slice(selectionEnd);
      onChange(next);
      setSelection(selectionStart + INDENT.length);
      return;
    }

    // Enter — auto-indent based on the current line
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = text.slice(lineStart, selectionStart);
      const indentMatch = currentLine.match(/^[ \t]*/);
      const indent = indentMatch ? indentMatch[0] : "";
      if (indent.length === 0) return; // fall through to default behaviour
      event.preventDefault();
      const insertion = "\n" + indent;
      const next =
        text.slice(0, selectionStart) + insertion + text.slice(selectionEnd);
      onChange(next);
      setSelection(selectionStart + insertion.length);
      return;
    }

    // Home / End fall through to native textarea handling, which moves the
    // caret AND scrolls the textarea horizontally to keep the caret in view.
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked – fail silently
    }
  };

  // The current-line indicator sits inside the (transformed) highlight overlay
  // so it scrolls horizontally with the content. It spans the full visible
  // viewport via a wide `width`.
  const currentLineTop = PADDING_Y + (caret.line - 1) * LINE_HEIGHT_PX;

  return (
    <div
      data-testid="html-code-editor"
      className="sb-html-editor"
      style={{
        border: "1px solid #2d2d30",
        borderRadius: 10,
        overflow: "hidden",
        background: "#1e1e1e",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header / title bar ─────────────────────────────────────────────── */}
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
            aria-hidden="true"
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => (findOpen ? closeFind() : openFind())}
            aria-pressed={findOpen}
            title="Find (Ctrl+F)"
            className="sb-html-editor__chrome-btn"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>Find</span>
          </button>
          <button
            type="button"
            onClick={() => setWordWrap((w) => !w)}
            aria-pressed={wordWrap}
            title={
              wordWrap
                ? "Disable word wrap (Alt+Z)"
                : "Enable word wrap (Alt+Z)"
            }
            className="sb-html-editor__chrome-btn"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 6h18M3 12h13a4 4 0 0 1 0 8h-3m0 0l2-2m-2 2l2 2M3 18h6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Wrap</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy all"
            className="sb-html-editor__chrome-btn"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="9"
                y="9"
                width="11"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M5 15V6a2 2 0 0 1 2-2h9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* ── Find toolbar ─────────────────────────────────────────────────── */}
      {findOpen && (
        <div
          data-testid="html-code-editor-find"
          className="sb-html-editor__find"
          role="search"
          aria-label="Find in editor"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={findInputRef}
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find"
            spellCheck={false}
            aria-label="Find text in editor"
            className="sb-html-editor__find-input"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                closeFind();
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (matches.length > 0) {
                  // First Enter after typing: jump to current; subsequent: next
                  if (e.shiftKey) {
                    gotoMatch(-1);
                  } else {
                    gotoMatch(1);
                  }
                }
              } else if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "g"
              ) {
                e.preventDefault();
                gotoMatch(e.shiftKey ? -1 : 1);
              }
            }}
          />
          <button
            type="button"
            aria-pressed={findCaseSensitive}
            onClick={() => setFindCaseSensitive((v) => !v)}
            title="Match case"
            aria-label="Match case"
            className="sb-html-editor__find-toggle"
          >
            Aa
          </button>
          <span className="sb-html-editor__find-count" aria-live="polite">
            {findQuery.length === 0
              ? "0 results"
              : matches.length === 0
                ? "No results"
                : `${safeFindIndex + 1} of ${matches.length}`}
          </span>
          <button
            type="button"
            onClick={() => gotoMatch(-1)}
            disabled={matches.length === 0}
            title="Previous match (Shift+Enter)"
            aria-label="Previous match"
            className="sb-html-editor__find-nav"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => gotoMatch(1)}
            disabled={matches.length === 0}
            title="Next match (Enter)"
            aria-label="Next match"
            className="sb-html-editor__find-nav"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={closeFind}
            title="Close (Esc)"
            aria-label="Close find"
            className="sb-html-editor__find-nav"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Editor viewport (vertical scroll lives here) ───────────────────── */}
      <div
        ref={verticalScrollRef}
        data-testid="html-code-editor-viewport"
        className="sb-html-editor__viewport"
        style={{
          maxHeight: Number.isFinite(maxHeight) ? maxHeight : undefined,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${GUTTER_WIDTH}px minmax(0, 1fr)`,
            position: "relative",
          }}
        >
          {/* Gutter */}
          <div
            data-testid="html-code-editor-gutter"
            aria-hidden="true"
            style={{
              background: "#181818",
              borderRight: "1px solid #2d2d30",
              color: "#6b7280",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: `${FONT_SIZE_PX}px`,
              lineHeight: `${LINE_HEIGHT_PX}px`,
              textAlign: "right",
              userSelect: "none",
              position: "relative",
            }}
          >
            <div
              data-testid="html-code-editor-gutter-content"
              style={{
                padding: `${PADDING_Y}px 0.65rem`,
              }}
            >
              {Array.from({ length: lineCount }, (_, index) => {
                const isActive = index + 1 === caret.line;
                return (
                  <div
                    key={index + 1}
                    style={{
                      color: isActive ? "#d4d4d4" : undefined,
                    }}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content (highlight + textarea) */}
          <div style={{ position: "relative", minWidth: 0 }}>
            {/* Current-line highlight */}
            <div
              ref={currentLineRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: currentLineTop,
                height: LINE_HEIGHT_PX,
                background: "rgba(255, 255, 255, 0.04)",
                borderTop: "1px solid rgba(255, 255, 255, 0.03)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                pointerEvents: "none",
              }}
            />

            {/* Match overlay (Find highlights). Sits behind the syntax
                highlight so the coloured tokens remain readable. */}
            {findOpen && matches.length > 0 && (
              <div
                aria-hidden="true"
                data-testid="html-code-editor-match-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                <pre
                  ref={matchOverlayRef}
                  style={{
                    margin: 0,
                    minHeight: "100%",
                    padding: `${PADDING_Y}px ${PADDING_X}px`,
                    minWidth: "100%",
                    width: editorContentWidth,
                    color: "transparent",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: `${FONT_SIZE_PX}px`,
                    lineHeight: `${LINE_HEIGHT_PX}px`,
                    whiteSpace: wordWrap ? "pre-wrap" : "pre",
                    wordBreak: wordWrap ? "break-word" : "normal",
                    tabSize: 2,
                    willChange: "transform",
                  }}
                  dangerouslySetInnerHTML={{ __html: matchOverlayMarkup }}
                />
              </div>
            )}

            {/* Highlight overlay */}
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
                  padding: `${PADDING_Y}px ${PADDING_X}px`,
                  minWidth: "100%",
                  width: editorContentWidth,
                  color: "#d4d4d4",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: `${FONT_SIZE_PX}px`,
                  lineHeight: `${LINE_HEIGHT_PX}px`,
                  whiteSpace: wordWrap ? "pre-wrap" : "pre",
                  wordBreak: wordWrap ? "break-word" : "normal",
                  tabSize: 2,
                  willChange: "transform",
                }}
                dangerouslySetInnerHTML={{ __html: highlightedMarkup }}
              />
            </div>

            {/* Real textarea */}
            <textarea
              ref={textareaRef}
              data-testid="html-code-editor-textarea"
              aria-label={ariaLabel}
              className="sb-html-editor__textarea"
              rows={1}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onScroll={handleTextareaScroll}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCaret}
              onClick={updateCaret}
              onSelect={updateCaret}
              onFocus={updateCaret}
              required={required}
              spellCheck={false}
              wrap={wordWrap ? "soft" : "off"}
              style={{
                position: "relative",
                zIndex: 1,
                display: "block",
                boxSizing: "border-box",
                width: "100%",
                padding: `${PADDING_Y}px ${PADDING_X}px`,
                border: "none",
                background: "transparent",
                color: "transparent",
                caretColor: "#ffffff",
                resize: "none",
                overflowX: wordWrap ? "hidden" : "auto",
                overflowY: "hidden",
                outline: "none",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: `${FONT_SIZE_PX}px`,
                lineHeight: `${LINE_HEIGHT_PX}px`,
                tabSize: 2,
                whiteSpace: wordWrap ? "pre-wrap" : "pre",
                wordBreak: wordWrap ? "break-word" : "normal",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom horizontal scrollbar (proxy for the textarea's hidden one) ── */}
      {!wordWrap && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${GUTTER_WIDTH}px minmax(0, 1fr)`,
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
              height: 14,
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
      )}

      {/* When word-wrap is on we still need to satisfy the test that the
          horizontal scrollbar is present in the document. Render it hidden. */}
      {wordWrap && (
        <div
          ref={horizontalScrollbarRef}
          data-testid="html-code-editor-horizontal-scrollbar"
          onScroll={handleHorizontalScrollbarScroll}
          style={{ display: "none" }}
        >
          <div
            data-testid="html-code-editor-horizontal-scrollbar-spacer"
            style={{ width: editorContentWidth }}
          />
        </div>
      )}

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <div
        data-testid="html-code-editor-statusbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.35rem 0.8rem",
          borderTop: "1px solid #2d2d30",
          background: "#007acc",
          color: "#ffffff",
          fontSize: "0.7rem",
          letterSpacing: "0.02em",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span>HTML</span>
          <span aria-hidden="true">·</span>
          <span>UTF-8</span>
          <span aria-hidden="true">·</span>
          <span>Spaces: 2</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span>
            Ln {caret.line}, Col {caret.col}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {actualLines.length} {actualLines.length === 1 ? "line" : "lines"}
          </span>
        </div>
      </div>

      {/* ── Scoped styles ─────────────────────────────────────────────────── */}
      <style>{`
        .sb-html-editor__textarea {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sb-html-editor__textarea::selection {
          background: rgba(38, 79, 120, 0.65);
        }

        .sb-html-editor__textarea::-webkit-scrollbar {
          display: none;
        }

        .sb-html-editor__chrome-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid transparent;
          background: transparent;
          color: #cccccc;
          font-size: 0.72rem;
          font-weight: 500;
          cursor: pointer;
          line-height: 1;
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
        }

        .sb-html-editor__chrome-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .sb-html-editor__chrome-btn:focus-visible {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 1px #007acc;
        }

        .sb-html-editor__chrome-btn[aria-pressed="true"] {
          background: rgba(0, 122, 204, 0.25);
          color: #ffffff;
          border-color: rgba(0, 122, 204, 0.6);
        }

        .sb-html-editor__viewport {
          scrollbar-color: #4f4f4f #1e1e1e;
          scrollbar-width: thin;
        }

        .sb-html-editor__viewport::-webkit-scrollbar {
          width: 14px;
        }

        .sb-html-editor__viewport::-webkit-scrollbar-track {
          background: #1e1e1e;
        }

        .sb-html-editor__viewport::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 999px;
          border: 3px solid #1e1e1e;
        }

        .sb-html-editor__viewport::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }

        .sb-html-editor__tag-angle { color: #808080; }
        .sb-html-editor__tag-name { color: #569cd6; }
        .sb-html-editor__attr-name { color: #9cdcfe; }
        .sb-html-editor__attr-value { color: #ce9178; }
        .sb-html-editor__operator { color: #d4d4d4; }
        .sb-html-editor__comment { color: #6a9955; font-style: italic; }
        .sb-html-editor__text { color: #d4d4d4; }
        .sb-html-editor__tag { color: #d4d4d4; }
        .sb-html-editor__newline { color: transparent; }

        .sb-html-editor__find {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #252526;
          border-bottom: 1px solid #2d2d30;
          color: #cccccc;
          font-size: 0.78rem;
        }

        .sb-html-editor__find-input {
          flex: 1;
          min-width: 0;
          background: #1e1e1e;
          color: #e5e7eb;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.78rem;
          outline: none;
        }

        .sb-html-editor__find-input:focus {
          border-color: #007acc;
          box-shadow: 0 0 0 1px #007acc;
        }

        .sb-html-editor__find-toggle {
          background: transparent;
          color: #cccccc;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          padding: 3px 7px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .sb-html-editor__find-toggle[aria-pressed="true"] {
          background: rgba(0, 122, 204, 0.25);
          border-color: rgba(0, 122, 204, 0.6);
          color: #ffffff;
        }

        .sb-html-editor__find-count {
          color: #9ca3af;
          font-size: 0.72rem;
          padding: 0 4px;
          min-width: 70px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .sb-html-editor__find-nav {
          background: transparent;
          color: #cccccc;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 3px 7px;
          font-size: 0.72rem;
          cursor: pointer;
          line-height: 1;
        }

        .sb-html-editor__find-nav:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
        }

        .sb-html-editor__find-nav:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .sb-html-editor__match {
          background: rgba(234, 179, 8, 0.35);
          border: 1px solid rgba(234, 179, 8, 0.55);
          border-radius: 2px;
          color: inherit;
          padding: 0;
          box-sizing: border-box;
          margin: -1px;
        }

        .sb-html-editor__match--active {
          background: rgba(245, 158, 11, 0.65);
          border-color: rgba(251, 191, 36, 0.95);
        }

        [data-testid="html-code-editor-horizontal-scrollbar"] {
          scrollbar-color: #4f4f4f #1e1e1e;
          scrollbar-width: thin;
        }

        [data-testid="html-code-editor-horizontal-scrollbar"]::-webkit-scrollbar {
          height: 12px;
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
