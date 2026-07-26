const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "body",
  "div",
  "dl",
  "dt",
  "dd",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const PRESERVE_WHITESPACE_TAGS = new Set(["pre", "code"]);

/** Maximum line length before text is word-wrapped. */
const WRAP_WIDTH = 150;

type FormatOptions = {
  indent?: string;
};

function hasRenderableSiblingContent(node: ChildNode | null) {
  if (!node) {
    return false;
  }

  if (node.nodeType === node.TEXT_NODE) {
    return Boolean((node.textContent ?? "").trim());
  }

  return node.nodeType === node.ELEMENT_NODE;
}

function isInlineSibling(node: ChildNode | null) {
  if (!node || node.nodeType !== node.ELEMENT_NODE) {
    return false;
  }

  return !BLOCK_TAGS.has((node as Element).tagName.toLowerCase());
}

function compactTextNode(node: Text) {
  const rawText = node.textContent ?? "";
  if (!rawText.trim()) {
    return "";
  }

  if (isPreserveWhitespaceContext(node.parentElement)) {
    return rawText;
  }

  const collapsed = rawText.replace(/\s+/g, " ").trim();
  const preserveLeadingSpace =
    /^\s/.test(rawText) &&
    hasRenderableSiblingContent(node.previousSibling) &&
    (node.previousSibling?.nodeType === node.TEXT_NODE ||
      isInlineSibling(node.previousSibling));
  const preserveTrailingSpace =
    /\s$/.test(rawText) &&
    hasRenderableSiblingContent(node.nextSibling) &&
    (node.nextSibling?.nodeType === node.TEXT_NODE ||
      isInlineSibling(node.nextSibling));

  return `${preserveLeadingSpace ? " " : ""}${collapsed}${preserveTrailingSpace ? " " : ""}`;
}

function serializeCompactNode(node: ChildNode): string {
  if (node.nodeType === node.TEXT_NODE) {
    return compactTextNode(node as Text);
  }

  if (node.nodeType === node.COMMENT_NODE) {
    const comment = (node.textContent ?? "").trim();
    return comment ? `<!-- ${comment} -->` : "";
  }

  if (node.nodeType !== node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const openTag = `<${tag}${serializeAttributes(element)}>`;

  if (VOID_TAGS.has(tag)) {
    return openTag;
  }

  const childHtml = Array.from(element.childNodes)
    .map((child) => serializeCompactNode(child))
    .join("");

  return `${openTag}${childHtml}</${tag}>`;
}

function collapseInlineWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Wrap `text` at word boundaries so no output line exceeds WRAP_WIDTH
 * characters (including the `indentPrefix` on each line).
 */
function wrapText(text: string, indentPrefix: string): string {
  const maxContent = Math.max(WRAP_WIDTH - indentPrefix.length, 40);
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxContent) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines.map((line) => `${indentPrefix}${line}`).join("\n");
}

function normalizeInlineHtml(value: string) {
  return value.trim().replace(/>\s+</g, "><");
}

function isPreserveWhitespaceContext(element: Element | null) {
  let current = element;
  while (current) {
    if (PRESERVE_WHITESPACE_TAGS.has(current.tagName.toLowerCase())) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function serializeAttributes(element: Element) {
  return Array.from(element.attributes)
    .map((attribute) => ` ${attribute.name}="${attribute.value}"`)
    .join("");
}

function shouldInlineElement(element: Element) {
  const tag = element.tagName.toLowerCase();
  if (PRESERVE_WHITESPACE_TAGS.has(tag)) {
    return false;
  }

  return Array.from(element.children).every(
    (child) => !BLOCK_TAGS.has(child.tagName.toLowerCase()),
  );
}

function serializeTextNode(node: Text, depth: number, indent: string) {
  const rawText = node.textContent ?? "";
  if (!rawText.trim()) {
    return "";
  }

  if (isPreserveWhitespaceContext(node.parentElement)) {
    const padding = indent.repeat(depth);
    return rawText
      .split("\n")
      .map((line) => `${padding}${line}`)
      .join("\n");
  }

  const collapsed = collapseInlineWhitespace(rawText);
  const prefix = indent.repeat(depth);
  if (`${prefix}${collapsed}`.length <= WRAP_WIDTH) {
    return `${prefix}${collapsed}`;
  }
  return wrapText(collapsed, prefix);
}

function serializeNode(node: ChildNode, depth: number, indent: string): string {
  if (node.nodeType === node.TEXT_NODE) {
    return serializeTextNode(node as Text, depth, indent);
  }

  if (node.nodeType === node.COMMENT_NODE) {
    const comment = (node.textContent ?? "").trim();
    return comment ? `${indent.repeat(depth)}<!-- ${comment} -->` : "";
  }

  if (node.nodeType !== node.ELEMENT_NODE) {
    return "";
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const openTag = `<${tag}${serializeAttributes(element)}>`;

  if (VOID_TAGS.has(tag)) {
    return `${indent.repeat(depth)}${openTag}`;
  }

  if (shouldInlineElement(element)) {
    const inlineHtml = normalizeInlineHtml(element.innerHTML);
    const inlinedLine = `${indent.repeat(depth)}${openTag}${inlineHtml}</${tag}>`;
    if (inlinedLine.length <= WRAP_WIDTH) {
      return inlinedLine;
    }
    // Line exceeds WRAP_WIDTH — fall through to block layout so text children
    // are indented and word-wrapped individually.
  }

  const childLines = Array.from(element.childNodes)
    .map((child) => serializeNode(child, depth + 1, indent))
    .filter(Boolean);

  if (childLines.length === 0) {
    return `${indent.repeat(depth)}${openTag}</${tag}>`;
  }

  return [
    `${indent.repeat(depth)}${openTag}`,
    childLines.join("\n"),
    `${indent.repeat(depth)}</${tag}>`,
  ].join("\n");
}

export function formatHtmlForEditing(
  html: string,
  { indent = "  " }: FormatOptions = {},
) {
  const input = html.trim();
  if (!input) {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return input;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<body>${input}</body>`, "text/html");
  const lines = Array.from(document.body.childNodes)
    .map((node) => serializeNode(node, 0, indent))
    .filter(Boolean);

  return lines.join("\n").trim() || input;
}

export function compactHtmlForStorage(html: string) {
  const input = html.trim();
  if (!input) {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return input.replace(/>\s+</g, "><");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<body>${input}</body>`, "text/html");
  const compacted = Array.from(document.body.childNodes)
    .map((node) => serializeCompactNode(node))
    .join("");

  return compacted || input;
}
