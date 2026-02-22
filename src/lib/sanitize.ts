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
      "data-component",
      "data-title",
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
