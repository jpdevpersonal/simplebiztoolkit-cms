/**
 * BlockRenderer – converts sanitised HTML into React, upgrading known
 * `data-sbt-block` elements to interactive React components.
 *
 * How it works
 * ─────────────
 * 1. Sanitise the incoming HTML with DOMPurify (via sanitizeHtml) to remove
 *    any XSS vectors while preserving `data-sbt-block` and related attrs.
 * 2. Parse the sanitised HTML using html-react-parser.
 * 3. In the `replace` callback, any element whose `data-sbt-block` attribute
 *    matches a key in BLOCK_REGISTRY is swapped for its React component.
 * 4. Unknown / unregistered blocks fall through to standard HTML rendering.
 *
 * Adding a new interactive block
 * ───────────────────────────────
 * 1. Create the component under src/components/blocks/.
 * 2. Import it here and add an entry to BLOCK_REGISTRY.
 *
 * Example HTML that triggers a block swap:
 *   <div data-sbt-block="profit-calculator"></div>
 * → renders <ProfitCalculator />
 */

import parse, { type DOMNode } from "html-react-parser";
import { sanitizeHtml } from "@/lib/sanitize";
import ProfitCalculator from "@/components/blocks/ProfitCalculator";

// ─── Block registry ───────────────────────────────────────────────────────────

/**
 * Maps the `data-sbt-block` value to the React component that should replace
 * the placeholder element. Components receive all HTML attributes as props.
 */
const BLOCK_REGISTRY: Record<
  string,
  React.ComponentType<Record<string, string>>
> = {
  "profit-calculator": ProfitCalculator,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BlockRendererProps {
  /** Raw HTML string from the database */
  html: string;
  /** Optional className applied to the wrapper element */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlockRenderer({ html, className }: BlockRendererProps) {
  if (!html) return null;

  const sanitized = sanitizeHtml(html);

  const content = parse(sanitized, {
    replace(domNode: DOMNode) {
      // Only process tag nodes that carry the block marker attribute
      if (!("attribs" in domNode)) return undefined;

      const attribs = (domNode as { attribs: Record<string, string> }).attribs;
      const blockType = attribs?.["data-sbt-block"];
      if (!blockType) return undefined;

      const Component = BLOCK_REGISTRY[blockType];
      if (!Component) return undefined; // render original HTML normally

      // Pass all HTML attributes as props so component can use them if needed
      return <Component key={`sbt-block-${blockType}`} {...attribs} />;
    },
  });

  return <div className={className}>{content}</div>;
}
