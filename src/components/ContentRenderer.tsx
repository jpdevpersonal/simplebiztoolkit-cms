/**
 * Dynamic Content Renderer
 * Converts database HTML content into styled React components
 * while preserving the design system from ArticleComponents.tsx
 */

import React from "react";
import {
  Section,
  Callout,
  ArticleFooter,
} from "@/components/ArticleComponents";
import { ArticleCTA } from "@/components/ArticleCTA";
import { sanitizeHtml } from "@/lib/sanitize";

/**
 * Content structure parser
 * Expects HTML with data attributes to map to components:
 *
 * <section data-component="section">...</section>
 * <aside data-component="callout" data-title="Title">...</aside>
 * <section data-component="article-cta" data-title="..." ...></section>
 */

interface ContentBlock {
  type: "section" | "callout" | "article-cta" | "html";
  content: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  disclosure?: string;
  showHomeLink?: boolean;
  showEtsyLink?: boolean;
}

function parseBooleanAttribute(value?: string | null): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

function parseAttributeFromString(attributes: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const match = attributes.match(regex);
  return match?.[1] ?? match?.[2] ?? "";
}

/**
 * Parse HTML content into structured blocks
 */
function parseContent(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Process each top-level element in the body
  const elements = Array.from(doc.body.children);

  elements.forEach((element) => {
    const componentType = element.getAttribute("data-component");

    if (componentType === "section") {
      blocks.push({
        type: "section",
        content: element.innerHTML,
      });
    } else if (componentType === "callout") {
      blocks.push({
        type: "callout",
        title: element.getAttribute("data-title") || "Note",
        content: element.innerHTML,
      });
    } else if (componentType === "article-cta") {
      blocks.push({
        type: "article-cta",
        content: "",
        title: element.getAttribute("data-title") || undefined,
        description: element.getAttribute("data-description") || undefined,
        primaryLabel: element.getAttribute("data-primary-label") || undefined,
        primaryHref: element.getAttribute("data-primary-href") || undefined,
        disclosure: element.getAttribute("data-disclosure") || undefined,
        showHomeLink: parseBooleanAttribute(
          element.getAttribute("data-show-home-link"),
        ),
        showEtsyLink: parseBooleanAttribute(
          element.getAttribute("data-show-etsy-link"),
        ),
      });
    } else {
      // Regular HTML content
      blocks.push({
        type: "html",
        content: element.outerHTML,
      });
    }
  });

  return blocks;
}

/**
 * Render a single content block
 */
function renderBlock(block: ContentBlock, index: number): React.ReactNode {
  switch (block.type) {
    case "section":
      return (
        <React.Fragment key={index}>
          <Section>
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </Section>
        </React.Fragment>
      );

    case "callout":
      return (
        <React.Fragment key={index}>
          <Callout title={block.title || "Note"}>
            <div dangerouslySetInnerHTML={{ __html: block.content }} />
          </Callout>
        </React.Fragment>
      );

    case "html":
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: block.content }} />
      );

    case "article-cta":
      return (
        <ArticleCTA
          key={index}
          title={block.title}
          description={block.description}
          primaryLabel={block.primaryLabel}
          primaryHref={block.primaryHref}
          disclosure={block.disclosure}
          showHomeLink={block.showHomeLink}
          showEtsyLink={block.showEtsyLink}
        />
      );

    default:
      return null;
  }
}

/**
 * Main Content Renderer Component
 */
export function DynamicContentRenderer({ html }: { html: string }) {
  const safeHtml = sanitizeHtml(html);
  // Only parse on client-side to avoid hydration mismatches
  if (typeof window === "undefined") {
    // Server-side: Return structured content without parsing
    return (
      <div className="dynamic-content">
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </div>
    );
  }

  const blocks = parseContent(safeHtml);

  return (
    <div className="dynamic-content">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

/**
 * Server-safe Content Renderer (Recommended)
 * Uses regex parsing to avoid DOMParser on server
 */
export function ContentRenderer({ html }: { html: string }) {
  const blocks = parseContentServer(sanitizeHtml(html));

  return (
    <>
      {blocks.map((block, index) => renderBlock(block, index))}
      <ArticleFooter />
    </>
  );
}

/**
 * Server-safe HTML parsing using regex
 */
function parseContentServer(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Match sections
  const sectionRegex =
    /<section[^>]*data-component="section"[^>]*>([\s\S]*?)<\/section>/gi;

  // Match callouts
  const calloutRegex =
    /<aside[^>]*data-component="callout"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/aside>/gi;

  // Match article CTA placeholders
  const articleCtaRegex =
    /<(section|div)\b([^>]*)data-component="article-cta"([^>]*)>([\s\S]*?)<\/\1>/gi;

  let lastIndex = 0;
  const matches: Array<{ index: number; end: number; block: ContentBlock }> =
    [];

  // Find all sections
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "section",
        content: match[1],
      },
    });
  }

  // Find all callouts
  while ((match = calloutRegex.exec(html)) !== null) {
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "callout",
        title: match[1] || "Note",
        content: match[2],
      },
    });
  }

  // Find all article CTA blocks
  while ((match = articleCtaRegex.exec(html)) !== null) {
    const attributes = `${match[2]} ${match[3]}`;
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "article-cta",
        content: "",
        title: parseAttributeFromString(attributes, "data-title") || undefined,
        description:
          parseAttributeFromString(attributes, "data-description") || undefined,
        primaryLabel:
          parseAttributeFromString(attributes, "data-primary-label") ||
          undefined,
        primaryHref:
          parseAttributeFromString(attributes, "data-primary-href") ||
          undefined,
        disclosure:
          parseAttributeFromString(attributes, "data-disclosure") || undefined,
        showHomeLink: parseBooleanAttribute(
          parseAttributeFromString(attributes, "data-show-home-link"),
        ),
        showEtsyLink: parseBooleanAttribute(
          parseAttributeFromString(attributes, "data-show-etsy-link"),
        ),
      },
    });
  }

  // Sort by order in document
  matches.sort((a, b) => a.index - b.index);

  // Build the blocks array
  matches.forEach(({ index, end, block }) => {
    // Add any HTML before this block
    if (index > lastIndex) {
      const beforeHtml = html.substring(lastIndex, index).trim();
      if (beforeHtml) {
        blocks.push({
          type: "html",
          content: beforeHtml,
        });
      }
    }

    blocks.push(block);
    lastIndex = end;
  });

  // Add any remaining HTML
  if (html) {
    if (lastIndex < html.length) {
      const remainingHtml = html.substring(lastIndex).trim();
      if (remainingHtml) {
        blocks.push({
          type: "html",
          content: remainingHtml,
        });
      }
    }
  }

  // If no structured blocks found, return the full HTML
  if (blocks.length === 0) {
    blocks.push({
      type: "html",
      content: html,
    });
  }

  return blocks;
}

/**
 * Utility: Convert existing React article to HTML format
 * Use this to export current articles for database import
 */
export function convertArticleToHtml(articleJsx: string): string {
  // This is a helper for migration
  // Convert JSX patterns to data-attribute HTML

  let html = articleJsx;

  // Convert <Section> tags
  html = html.replace(
    /<Section>([\s\S]*?)<\/Section>/g,
    '<section data-component="section">$1</section>',
  );

  // Convert <Callout> tags
  html = html.replace(
    /<Callout\s+title="([^"]*)">([\s\S]*?)<\/Callout>/g,
    '<aside data-component="callout" data-title="$1">$2</aside>',
  );

  // Convert self-closing <ArticleCTA ... /> tags
  html = html.replace(
    /<ArticleCTA\s+([^>]*)\/>/g,
    '<section data-component="article-cta" $1></section>',
  );

  return html;
}
