/**
 * HTML Sanitizer for XSS Prevention
 * Uses isomorphic-dompurify — works identically on the server (Node/jsdom)
 * and in the browser (native DOM).  The old regex approach was bypassable.
 */

import DOMPurify from "isomorphic-dompurify";

const BODY_H1_REGEX = /<(\/?)h1(\s|>)/gi;
const STYLE_BLOCK_REGEX = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_BLOCK_PLACEHOLDER_ATTR = "data-sbt-style-block";
const STYLE_BLOCK_PLACEHOLDER_REGEX =
  /<span\s+data-sbt-style-block="(\d+)"><\/span>/gi;

type PreservedStyleBlock = {
  css: string;
};

declare global {
  // Shared one-time guard for DOMPurify hook registration across module reloads.
  // eslint-disable-next-line no-var
  var __sbtDomPurifyHooksInstalled: boolean | undefined;
}

// DOMPurify (v3) leaves dangerous CSS values such as `url(javascript:…)`,
// `expression(…)` and `behavior:` inside `style` attributes intact when
// running through jsdom. We allow `style` for layout markup, so we install
// a hook that strips those patterns before the attribute is written. The
// hook runs once at module load and is idempotent.
const DANGEROUS_CSS_PATTERNS: RegExp[] = [
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
  /vbscript\s*:/gi,
];

function scrubStyleValue(value: string): string {
  let cleaned = value;
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned;
}

function extractStyleBlocks(html: string) {
  const styleBlocks: PreservedStyleBlock[] = [];
  const htmlWithPlaceholders = html.replace(
    STYLE_BLOCK_REGEX,
    (_match, css: string) => {
      const index = styleBlocks.push({ css: scrubStyleValue(css) }) - 1;
      return `<span ${STYLE_BLOCK_PLACEHOLDER_ATTR}="${index}"></span>`;
    },
  );

  return { htmlWithPlaceholders, styleBlocks };
}

function restoreStyleBlocks(html: string, styleBlocks: PreservedStyleBlock[]) {
  return html.replace(
    STYLE_BLOCK_PLACEHOLDER_REGEX,
    (_match, index: string) => {
      const styleBlock = styleBlocks[Number(index)];
      return styleBlock ? `<style>${styleBlock.css}</style>` : "";
    },
  );
}

if (!globalThis.__sbtDomPurifyHooksInstalled) {
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (data.attrName === "style" && typeof data.attrValue === "string") {
      data.attrValue = scrubStyleValue(data.attrValue);
    }
  });

  DOMPurify.addHook("uponSanitizeElement", (node) => {
    if (node.nodeName.toLowerCase() === "style") {
      node.textContent = scrubStyleValue(node.textContent || "");
    }
  });

  globalThis.__sbtDomPurifyHooksInstalled = true;
}

/**
 * Sanitize an HTML string, removing all XSS vectors.
 * Safe to call on both server and client.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const { htmlWithPlaceholders, styleBlocks } = extractStyleBlocks(html);
  const sanitized = DOMPurify.sanitize(htmlWithPlaceholders, {
    // Allow the structural/formatting tags Tiptap produces, plus layout
    // tags that the CMS supports through RawHtmlBlock (section, aside,
    // svg, etc.) so authored hero/marketing sections render correctly on
    // the public site.
    ALLOWED_TAGS: [
      // Text & formatting
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "mark",
      "small",
      "sub",
      "sup",
      "time",
      "abbr",
      "cite",
      "kbd",
      "code",
      "pre",
      "blockquote",
      // Headings
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      // Lists
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      // Links & media
      "a",
      "img",
      "figure",
      "figcaption",
      "picture",
      "source",
      "style",
      // Sectioning & layout
      "section",
      "aside",
      "header",
      "footer",
      "nav",
      "article",
      "main",
      "div",
      "span",
      "hr",
      "details",
      "summary",
      // Tables
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "caption",
      "colgroup",
      "col",
      // Inline SVG (used heavily in marketing hero blocks)
      "svg",
      "g",
      "defs",
      "symbol",
      "use",
      "linearGradient",
      "radialGradient",
      "stop",
      "path",
      "polyline",
      "polygon",
      "line",
      "rect",
      "circle",
      "ellipse",
      "text",
      "tspan",
      "title",
      "desc",
      "mask",
      "clipPath",
      "pattern",
      "marker",
    ],
    ALLOWED_ATTR: [
      // Standard HTML
      "href",
      "src",
      "srcset",
      "sizes",
      "alt",
      "title",
      "class",
      "id",
      "style",
      "role",
      "tabindex",
      "lang",
      "dir",
      "name",
      "target",
      "rel",
      "loading",
      "decoding",
      "open",
      "type",
      "media",
      // Legacy CMS component attributes
      "data-component",
      "data-title",
      "data-description",
      "data-primary-label",
      "data-primary-href",
      "data-disclosure",
      "data-show-home-link",
      "data-show-etsy-link",
      // Block editor attributes (data-sbt-block system)
      "data-sbt-block",
      "data-tone",
      "data-text",
      "data-background-color",
      "data-border-width",
      "data-title-level",
      "data-text-level",
      "data-title-size",
      "data-text-size",
      "data-button-text",
      "data-button-url",
      "data-button-bg",
      "data-button-color",
      "data-button-padding",
      "data-button-radius",
      "data-show-second-button",
      "data-second-button-text",
      "data-second-button-url",
      "data-second-button-bg",
      "data-second-button-color",
      "data-second-button-padding",
      "data-second-button-radius",
      // SVG presentation & geometry
      "viewBox",
      "preserveAspectRatio",
      "xmlns",
      "xmlns:xlink",
      "width",
      "height",
      "fill",
      "fill-opacity",
      "fill-rule",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-dasharray",
      "stroke-dashoffset",
      "stroke-miterlimit",
      "stroke-opacity",
      "opacity",
      "transform",
      "points",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "d",
      "offset",
      "stop-color",
      "stop-opacity",
      "gradientUnits",
      "gradientTransform",
      "spreadMethod",
      "patternUnits",
      "clip-path",
      "mask",
    ],
    // aria-* and data-* are allowed via these flags so we don't have to
    // enumerate every individual aria-/data- attribute the authoring UI
    // may emit.
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: true,
    // Forbid dangerous URI schemes
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    // Never return DOM — always return a string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  return restoreStyleBlocks(sanitized, styleBlocks);
}

export function demoteBodyH1ToH2(html: string): string {
  if (!html) return "";
  return html.replace(BODY_H1_REGEX, "<$1h2$2");
}

export function sanitizePublicContentHtml(html: string): string {
  return demoteBodyH1ToH2(sanitizeHtml(html));
}

/**
 * Validate that HTML only contains allowed tags (legacy helper, kept for tests).
 */
export function validateHtmlTags(html: string): boolean {
  // If sanitizeHtml produces the same output the content is safe
  return sanitizeHtml(html) === html;
}

/**
 * Strip all HTML tags from content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Truncate HTML content to a specific length while preserving tags
 */
export function truncateHtml(html: string, maxLength: number): string {
  const stripped = stripHtml(html);

  if (stripped.length <= maxLength) {
    return html;
  }

  return stripped.substring(0, maxLength) + "...";
}
