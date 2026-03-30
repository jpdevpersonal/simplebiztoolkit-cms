export function getTiptapScopedStyles(options: {
  minHeight: number;
  /** Label shown for legacy CTA placeholder nodes */
  legacyCtaLabel?: string;
  /** Whether to style selected legacy CTA nodes */
  includeLegacySelectedBorder?: boolean;
}): string {
  const {
    minHeight,
    legacyCtaLabel = "Legacy CTA block",
    includeLegacySelectedBorder = false,
  } = options;

  return `
    .tiptap {
      outline: none;
      min-height: ${minHeight}px;
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
    .tiptap h5 { font-size: 0.875rem; font-weight: 600; margin: 0.625rem 0 0.2rem; letter-spacing: 0.04em; }
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
    .tiptap pre code { background: transparent; padding: 0; color: inherit; }
    .tiptap hr { border: none; border-top: 2px solid #dee2e6; margin: 1.25rem 0; }
    .tiptap a { color: var(--sb-primary, #0d6efd); text-decoration: underline; }
    .tiptap img { max-width: 100%; border-radius: 4px; height: auto; }

    .tiptap section[data-component="article-cta"] {
      margin: 0.75rem 0;
      border: 1px dashed #adb5bd;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      background: #f8f9fa;
      min-height: 2.25rem;
      position: relative;
    }
    .tiptap section[data-component="article-cta"]::before {
      content: "${legacyCtaLabel}";
      font-size: 0.8125rem;
      font-weight: 600;
      color: #495057;
    }
    ${
      includeLegacySelectedBorder
        ? `.tiptap .ProseMirror-selectednode[data-component="article-cta"] { border-color: var(--sb-primary, #0d6efd); }`
        : ""
    }
  `;
}
