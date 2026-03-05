/**
 * Dynamic Content Renderer
 * Converts database HTML content into styled React components
 * while preserving the design system from ArticleComponents.tsx
 */

import React from "react";
import Image from "next/image";
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
 * Legacy:
 * <section data-component="section">...</section>
 * <aside data-component="callout" data-title="Title">...</aside>
 * <section data-component="article-cta" data-title="..." ...></section>
 *
 * Block editor (data-sbt-block):
 * <div data-sbt-block="callout" data-tone="info">...</div>
 * <section data-sbt-block="cta"><h2>...</h2><p>...</p><a>...</a></section>
 * <figure data-sbt-block="image"><img src="..." alt="..."><figcaption>...</figcaption></figure>
 */

interface ContentBlock {
  type:
    | "section"
    | "callout"
    | "article-cta"
    | "html"
    | "sbt-callout"
    | "sbt-cta"
    | "sbt-image";
  content: string;
  // legacy callout / article-cta
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  disclosure?: string;
  showHomeLink?: boolean;
  showEtsyLink?: boolean;
  // sbt-callout
  tone?: "info" | "warning" | "success";
  // sbt-cta
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  // sbt-image
  src?: string;
  alt?: string;
  caption?: string;
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
    const sbtBlock = element.getAttribute("data-sbt-block");

    if (sbtBlock === "callout") {
      blocks.push({
        type: "sbt-callout",
        content: element.innerHTML,
        tone:
          (element.getAttribute("data-tone") as ContentBlock["tone"]) || "info",
      });
    } else if (sbtBlock === "cta") {
      blocks.push({
        type: "sbt-cta",
        content: "",
        ctaTitle: element.querySelector("h2")?.textContent?.trim() || "",
        ctaText: element.querySelector("p")?.textContent?.trim() || "",
        ctaButtonText: element.querySelector("a")?.textContent?.trim() || "",
        ctaButtonUrl: element.querySelector("a")?.getAttribute("href") || "/",
      });
    } else if (sbtBlock === "image") {
      const img = element.querySelector("img");
      blocks.push({
        type: "sbt-image",
        content: "",
        src: img?.getAttribute("src") || "",
        alt: img?.getAttribute("alt") || "",
        caption: element.querySelector("figcaption")?.textContent?.trim() || "",
      });
    } else if (componentType === "section") {
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

    case "sbt-callout": {
      const toneStyles: Record<
        string,
        { borderColor: string; background: string; icon: string }
      > = {
        info: { borderColor: "#3b82f6", background: "#eff6ff", icon: "💡" },
        warning: { borderColor: "#f59e0b", background: "#fffbeb", icon: "⚠️" },
        success: { borderColor: "#22c55e", background: "#f0fdf4", icon: "✅" },
      };
      const tone = block.tone || "info";
      const { borderColor, background, icon } =
        toneStyles[tone] ?? toneStyles.info;
      return (
        <div
          key={index}
          className={`sbt-callout sbt-callout-${tone}`}
          style={{
            borderLeft: `4px solid ${borderColor}`,
            background,
            borderRadius: 4,
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <span aria-hidden="true" style={{ marginRight: 6 }}>
            {icon}
          </span>
          <div
            dangerouslySetInnerHTML={{ __html: block.content }}
            style={{ display: "inline" }}
          />
        </div>
      );
    }

    case "sbt-cta":
      return (
        <section
          key={index}
          className="sbt-cta"
          style={{
            background: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: 8,
            padding: "24px 28px",
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          {block.ctaTitle && (
            <h2 style={{ marginBottom: 8 }}>{block.ctaTitle}</h2>
          )}
          {block.ctaText && (
            <p style={{ marginBottom: 16, color: "#495057" }}>
              {block.ctaText}
            </p>
          )}
          {block.ctaButtonText && (
            <a
              href={block.ctaButtonUrl || "/"}
              className="cta-button btn btn-primary"
            >
              {block.ctaButtonText}
            </a>
          )}
        </section>
      );

    case "sbt-image":
      if (!block.src) return null;
      return (
        <figure key={index} style={{ margin: "24px 0" }}>
          <Image
            src={block.src}
            alt={block.alt || ""}
            width={1200}
            height={630}
            sizes="(max-width: 768px) 100vw, 800px"
            style={{ width: "100%", height: "auto", borderRadius: 4 }}
          />
          {block.caption && (
            <figcaption
              style={{
                textAlign: "center",
                color: "#6c757d",
                fontSize: "0.875rem",
                marginTop: 6,
              }}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
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

  // Match legacy sections
  const sectionRegex =
    /<section[^>]*data-component="section"[^>]*>([\s\S]*?)<\/section>/gi;

  // Match legacy callouts
  const calloutRegex =
    /<aside[^>]*data-component="callout"[^>]*data-title="([^"]*)"[^>]*>([\s\S]*?)<\/aside>/gi;

  // Match legacy article CTA placeholders
  const articleCtaRegex =
    /<(section|div)\b([^>]*)data-component="article-cta"([^>]*)>([\s\S]*?)<\/\1>/gi;

  // Block-editor: sbt-callout  <div data-sbt-block="callout" ...>...</div>
  const sbtCalloutRegex =
    /<div\b([^>]*)data-sbt-block="callout"([^>]*)>([\s\S]*?)<\/div>/gi;

  // Block-editor: sbt-cta  <section data-sbt-block="cta">...</section>
  const sbtCtaRegex =
    /<section\b([^>]*)data-sbt-block="cta"([^>]*)>([\s\S]*?)<\/section>/gi;

  // Block-editor: sbt-image  <figure data-sbt-block="image">...</figure>
  const sbtImageRegex =
    /<figure\b([^>]*)data-sbt-block="image"([^>]*)>([\s\S]*?)<\/figure>/gi;

  let lastIndex = 0;
  const matches: Array<{ index: number; end: number; block: ContentBlock }> =
    [];

  // Find all legacy sections
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: { type: "section", content: match[1] },
    });
  }

  // Find all legacy callouts
  while ((match = calloutRegex.exec(html)) !== null) {
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: { type: "callout", title: match[1] || "Note", content: match[2] },
    });
  }

  // Find all legacy article CTA blocks
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

  // Find all sbt-callout blocks
  while ((match = sbtCalloutRegex.exec(html)) !== null) {
    const attrs = `${match[1]} ${match[2]}`;
    const tone =
      (parseAttributeFromString(attrs, "data-tone") as ContentBlock["tone"]) ||
      "info";
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: { type: "sbt-callout", content: match[3], tone },
    });
  }

  // Find all sbt-cta blocks
  while ((match = sbtCtaRegex.exec(html)) !== null) {
    const inner = match[3];
    const h2Match = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(inner);
    const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(inner);
    const aMatch = /<a\b([^>]*)>([\s\S]*?)<\/a>/i.exec(inner);
    const hrefMatch = aMatch ? /href="([^"]*)"/.exec(aMatch[1]) : null;
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "sbt-cta",
        content: "",
        ctaTitle: h2Match?.[1]?.trim() || "",
        ctaText: pMatch?.[1]?.trim() || "",
        ctaButtonText: aMatch?.[2]?.trim() || "",
        ctaButtonUrl: hrefMatch?.[1] || "/",
      },
    });
  }

  // Find all sbt-image blocks
  while ((match = sbtImageRegex.exec(html)) !== null) {
    const inner = match[3];
    const imgMatch = /<img\b([^>]*)\/?>/i.exec(inner);
    const srcMatch = imgMatch ? /src="([^"]*)"/.exec(imgMatch[1]) : null;
    const altMatch = imgMatch ? /alt="([^"]*)"/.exec(imgMatch[1]) : null;
    const capMatch = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner);
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "sbt-image",
        content: "",
        src: srcMatch?.[1] || "",
        alt: altMatch?.[1] || "",
        caption: capMatch?.[1]?.trim() || "",
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
