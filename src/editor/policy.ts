/**
 * EditorPolicy – allowlist controlling which node and mark types the editor
 * toolbar exposes for insertion.
 *
 * When a policy is supplied to BlockEditor:
 *   • Toolbar buttons for disallowed types are hidden.
 *   • Insertion helper functions bail-out early with a console warning.
 *   • Existing content of a disallowed type still renders (read-only behaviour
 *     is controlled separately by the `locked` attribute / Locking extension).
 *
 * Pass `undefined` (the default) to allow everything.
 */

export interface EditorPolicy {
  /** Node type names whose toolbar insert buttons are visible. */
  allowedNodes: string[];
  /**
   * Mark type names whose toolbar buttons are visible.
   * Use TipTap extension names, e.g. "bold", "italic", "link", "textStyle".
   */
  allowedMarks: string[];
}

// ─── Preset policies ──────────────────────────────────────────────────────────

/**
 * Full-featured policy – equivalent to no policy being set.
 * All built-in blocks and marks are allowed.
 */
export const FULL_POLICY: EditorPolicy = {
  allowedNodes: [
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "codeBlock",
    "horizontalRule",
    "hardBreak",
    // CMS custom blocks
    "callout",
    "ctaSbtBlock",
    "imageBlock",
    "relatedLinksSbtBlock",
  ],
  allowedMarks: [
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    "link",
    "textStyle",
    "color",
  ],
};

/**
 * Inline content policy – the full policy minus the Related Links block, which
 * is managed by a dedicated editor section rather than inline. Shared by the
 * page and template (product) editors.
 */
export const INLINE_CONTENT_POLICY: EditorPolicy = {
  ...FULL_POLICY,
  allowedNodes: FULL_POLICY.allowedNodes.filter(
    (nodeName) => nodeName !== "relatedLinksSbtBlock",
  ),
};

/**
 * Basic policy – standard prose formatting only; no CMS custom blocks,
 * no code blocks / advanced marks.
 */
export const BASIC_POLICY: EditorPolicy = {
  allowedNodes: [
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "hardBreak",
  ],
  allowedMarks: ["bold", "italic", "link"],
};

/**
 * CMS blocks-only policy – custom blocks are allowed but no raw code blocks
 * or text-colour controls.
 */
export const CMS_BLOCKS_POLICY: EditorPolicy = {
  allowedNodes: [
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "hardBreak",
    "callout",
    "ctaSbtBlock",
    "imageBlock",
    "relatedLinksSbtBlock",
  ],
  allowedMarks: ["bold", "italic", "underline", "strike", "link"],
};
