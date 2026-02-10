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

/**
 * Content structure parser
 * Expects HTML with data attributes to map to components:
 *
 * <section data-component="section">...</section>
 * <aside data-component="callout" data-title="Title">...</aside>
 */

interface ContentBlock {
  type: "section" | "callout" | "html";
  content: string;
  title?: string;
  children?: ContentBlock[];
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

    default:
      return null;
  }
}

/**
 * Main Content Renderer Component
 */
export function DynamicContentRenderer({ html }: { html: string }) {
  // Only parse on client-side to avoid hydration mismatches
  if (typeof window === "undefined") {
    // Server-side: Return structured content without parsing
    return (
      <div className="dynamic-content">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  const blocks = parseContent(html);

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
  const blocks = parseContentServer(html);

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

  let lastIndex = 0;
  const matches: Array<{ index: number; block: ContentBlock }> = [];

  // Find all sections
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    matches.push({
      index: match.index,
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
      block: {
        type: "callout",
        title: match[1] || "Note",
        content: match[2],
      },
    });
  }

  // Sort by order in document
  matches.sort((a, b) => a.index - b.index);

  // Build the blocks array
  matches.forEach(({ index, block }) => {
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
    lastIndex =
      index + html.substring(index).indexOf("</section>") + "</section>".length;
  });

  // Add any remaining HTML
  if (lastIndex < html.length) {
    const remainingHtml = html.substring(lastIndex).trim();
    if (remainingHtml) {
      blocks.push({
        type: "html",
        content: remainingHtml,
      });
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

  return html;
}
