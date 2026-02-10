/**
 * HTML Sanitizer for XSS Prevention
 * Lightweight alternative to DOMPurify for server-side use
 */

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
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
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  section: ["data-component"],
  aside: ["data-component", "data-title"],
  div: ["class"],
  span: ["class"],
};

/**
 * Basic HTML sanitization
 * For production, consider using DOMPurify or isomorphic-dompurify
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove on* event handlers
  html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
  html = html.replace(/\son\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  html = html.replace(/javascript:/gi, "");

  // Remove data: protocol from src attributes
  html = html.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""');

  return html;
}

/**
 * Validate that HTML only contains allowed tags
 */
export function validateHtmlTags(html: string): boolean {
  const tagRegex = /<(\w+)[^>]*>/g;
  const tags = [];
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    tags.push(match[1].toLowerCase());
  }

  return tags.every((tag) => ALLOWED_TAGS.includes(tag));
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
