/**
 * HTML Sanitizer for XSS Prevention
 * Uses isomorphic-dompurify — works identically on the server (Node/jsdom)
 * and in the browser (native DOM).  The old regex approach was bypassable.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize an HTML string, removing all XSS vectors.
 * Safe to call on both server and client.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    // Allow the structural/formatting tags Tiptap produces
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "figure",
      "figcaption",
      "section",
      "aside",
      "div",
      "span",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
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
      // Allow target="_blank" on links
      "target",
      "rel",
    ],
    // Forbid dangerous URI schemes
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    // Never return DOM — always return a string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
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
