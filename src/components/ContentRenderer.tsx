/**
 * Dynamic Content Renderer
 * Converts database HTML content into styled React components
 * while preserving the shared content design system.
 */

import React from "react";
import Image from "next/image";
import { Section, Callout, ContentFooter } from "@/components/ContentBlocks";
import { ContentCta } from "@/components/ContentCta";
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
    | "sbt-cta"
    | "html"
    | "sbt-callout"
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
  ctaTitleLevel?: HeadingLevel;
  ctaTextLevel?: HeadingLevel;
  ctaBackgroundColor?: string;
  ctaBorderWidth?: number;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
  ctaButtonGap?: number;
  ctaButtonAlign?: CTAButtonAlignment;
  ctaButtonBg?: string;
  ctaButtonColor?: string;
  ctaButtonPadding?: number;
  ctaButtonRadius?: number;
  ctaShowSecondButton?: boolean;
  ctaSecondButtonText?: string;
  ctaSecondButtonUrl?: string;
  ctaSecondButtonAlign?: CTAButtonAlignment;
  ctaSecondButtonBg?: string;
  ctaSecondButtonColor?: string;
  ctaSecondButtonPadding?: number;
  ctaSecondButtonRadius?: number;
  // sbt-image
  src?: string;
  alt?: string;
  caption?: string;
}

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5";
type CTAButtonAlignment = "none" | "left" | "center" | "right";
type CTAButtonRole = "primary" | "secondary";

const CTA_HEADING_OPTIONS: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5"];

const CTA_LEVEL_FONT_SIZES: Record<HeadingLevel, string> = {
  h1: "2.25rem",
  h2: "1.875rem",
  h3: "1.5rem",
  h4: "1.25rem",
  h5: "1.125rem",
};
const CTA_SECTION_DEFAULT_BG = "#f8f9fa";
const CTA_SECTION_DEFAULT_BORDER_WIDTH = 1;
const CTA_SECTION_BORDER_COLOR = "#dee2e6";
const CTA_BUTTON_DEFAULT_GAP = 16;
const CTA_BUTTON_DEFAULT_ALIGNMENT: CTAButtonAlignment = "none";
const CTA_BUTTON_WHITE_BORDER = "1px solid rgba(0, 0, 0, .2)";

type CTAButtonStyleVars = React.CSSProperties & Record<`--${string}`, string>;

function isHeadingLevel(value: unknown): value is HeadingLevel {
  return CTA_HEADING_OPTIONS.includes(value as HeadingLevel);
}

function isCTAButtonAlignment(value: unknown): value is CTAButtonAlignment {
  return ["none", "left", "center", "right"].includes(
    value as CTAButtonAlignment,
  );
}

function getCTAButtonElement(
  element: Element,
  role: CTAButtonRole,
): HTMLAnchorElement | null {
  const roleMatch = element.querySelector(
    `a[data-button-role="${role}"]`,
  ) as HTMLAnchorElement | null;
  if (roleMatch) return roleMatch;

  const anchors = element.querySelectorAll("a");
  return (
    role === "primary" ? anchors[0] : anchors[1]
  ) as HTMLAnchorElement | null;
}

function getCTAButtonMatch(
  anchorMatches: RegExpMatchArray[],
  role: CTAButtonRole,
): RegExpMatchArray | undefined {
  const rolePattern = new RegExp(
    `data-button-role\\s*=\\s*["']${role}["']`,
    "i",
  );
  return (
    anchorMatches.find((anchorMatch) => rolePattern.test(anchorMatch[1])) ||
    (role === "primary" ? anchorMatches[0] : anchorMatches[1])
  );
}

function getCTAButtonLayout<T extends { align: CTAButtonAlignment }>(
  buttons: T[],
): {
  leftButtons: T[];
  centerButtons: T[];
  rightButtons: T[];
} {
  return {
    leftButtons: buttons.filter((button) => button.align === "left"),
    centerButtons: buttons.filter(
      (button) => button.align === "none" || button.align === "center",
    ),
    rightButtons: buttons.filter((button) => button.align === "right"),
  };
}

function levelFromLegacySize(value?: string | null): HeadingLevel | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed >= 36) return "h1";
  if (parsed >= 28) return "h2";
  if (parsed >= 22) return "h3";
  if (parsed >= 18) return "h4";
  return "h5";
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

function parseNumericAttribute(value?: string | null, fallback = 0): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumericAttribute(
  value?: string | null,
): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseHeadingLevelAttribute(
  value?: string | null,
  fallback?: HeadingLevel,
): HeadingLevel | undefined {
  if (isHeadingLevel(value)) return value;
  return fallback;
}

function isWhiteButtonBackground(value?: string | null): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return [
    "#fff",
    "#ffffff",
    "white",
    "rgb(255,255,255)",
    "rgb(255, 255, 255)",
  ].includes(normalized);
}

function getCTAButtonStyleVars(
  buttonBg?: string,
  buttonColor?: string,
  buttonPadding?: number,
  buttonRadius?: number,
): CTAButtonStyleVars {
  return {
    ...(buttonBg
      ? {
          "--sb-btn-bg": buttonBg,
          "--sb-btn-bg-hover": buttonBg,
        }
      : {}),
    ...(buttonColor ? { "--sb-btn-color": buttonColor } : {}),
    ...(typeof buttonPadding === "number"
      ? { "--sb-btn-padding": `${buttonPadding}px` }
      : {}),
    ...(typeof buttonRadius === "number"
      ? { "--sb-btn-radius": `${buttonRadius}px` }
      : {}),
    ...(isWhiteButtonBackground(buttonBg)
      ? { border: CTA_BUTTON_WHITE_BORDER }
      : {}),
  };
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
      const anchor = getCTAButtonElement(element, "primary");
      const secondAnchor = getCTAButtonElement(element, "secondary");
      const title = element.querySelector("h1, h2, h3, h4, h5");
      const text = element.querySelector("p");
      const titleTagLevel = title?.tagName.toLowerCase();
      blocks.push({
        type: "sbt-cta",
        content: "",
        ctaTitle: title?.textContent?.trim() || "",
        ctaText: text?.textContent?.trim() || "",
        ctaTitleLevel: parseHeadingLevelAttribute(
          title?.getAttribute("data-title-level"),
          levelFromLegacySize(title?.getAttribute("data-title-size")) ??
            (isHeadingLevel(titleTagLevel) ? titleTagLevel : "h2"),
        ),
        ctaTextLevel: parseHeadingLevelAttribute(
          text?.getAttribute("data-text-level"),
          levelFromLegacySize(text?.getAttribute("data-text-size")) ?? "h5",
        ),
        ctaBackgroundColor:
          element.getAttribute("data-background-color") || undefined,
        ctaBorderWidth: parseOptionalNumericAttribute(
          element.getAttribute("data-border-width"),
        ),
        ctaButtonGap: parseOptionalNumericAttribute(
          element.getAttribute("data-button-gap"),
        ),
        ctaButtonText: anchor?.textContent?.trim() || "",
        ctaButtonUrl: anchor?.getAttribute("href") || "/",
        ctaButtonAlign: isCTAButtonAlignment(
          anchor?.getAttribute("data-button-align"),
        )
          ? (anchor?.getAttribute("data-button-align") as CTAButtonAlignment)
          : CTA_BUTTON_DEFAULT_ALIGNMENT,
        ctaButtonBg: anchor?.getAttribute("data-button-bg") || undefined,
        ctaButtonColor: anchor?.getAttribute("data-button-color") || undefined,
        ctaButtonPadding: parseNumericAttribute(
          anchor?.getAttribute("data-button-padding"),
          8,
        ),
        ctaButtonRadius: parseNumericAttribute(
          anchor?.getAttribute("data-button-radius"),
          3,
        ),
        ctaShowSecondButton: !!secondAnchor,
        ctaSecondButtonText: secondAnchor?.textContent?.trim() || undefined,
        ctaSecondButtonUrl: secondAnchor?.getAttribute("href") || undefined,
        ctaSecondButtonAlign: isCTAButtonAlignment(
          secondAnchor?.getAttribute("data-button-align"),
        )
          ? (secondAnchor?.getAttribute(
              "data-button-align",
            ) as CTAButtonAlignment)
          : CTA_BUTTON_DEFAULT_ALIGNMENT,
        ctaSecondButtonBg:
          secondAnchor?.getAttribute("data-second-button-bg") ||
          secondAnchor?.getAttribute("data-button-bg") ||
          undefined,
        ctaSecondButtonColor:
          secondAnchor?.getAttribute("data-second-button-color") ||
          secondAnchor?.getAttribute("data-button-color") ||
          undefined,
        ctaSecondButtonPadding: parseNumericAttribute(
          secondAnchor?.getAttribute("data-second-button-padding") ||
            secondAnchor?.getAttribute("data-button-padding"),
          8,
        ),
        ctaSecondButtonRadius: parseNumericAttribute(
          secondAnchor?.getAttribute("data-second-button-radius") ||
            secondAnchor?.getAttribute("data-button-radius"),
          3,
        ),
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
        <ContentCta
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

    case "sbt-cta": {
      const titleLevel =
        block.ctaTitleLevel && isHeadingLevel(block.ctaTitleLevel)
          ? block.ctaTitleLevel
          : "h2";
      const textLevel =
        block.ctaTextLevel && isHeadingLevel(block.ctaTextLevel)
          ? block.ctaTextLevel
          : "h5";
      const TitleTag = titleLevel;
      const buttonGap =
        typeof block.ctaButtonGap === "number"
          ? block.ctaButtonGap
          : CTA_BUTTON_DEFAULT_GAP;
      const buttonLayout = getCTAButtonLayout(
        [
          {
            key: "primary" as const,
            label: block.ctaButtonText || "",
            href: block.ctaButtonUrl || "/",
            align: isCTAButtonAlignment(block.ctaButtonAlign)
              ? block.ctaButtonAlign
              : CTA_BUTTON_DEFAULT_ALIGNMENT,
            style: getCTAButtonStyleVars(
              block.ctaButtonBg,
              block.ctaButtonColor,
              block.ctaButtonPadding,
              block.ctaButtonRadius,
            ),
          },
          ...(block.ctaShowSecondButton
            ? [
                {
                  key: "secondary" as const,
                  label: block.ctaSecondButtonText || block.ctaButtonText || "",
                  href: block.ctaSecondButtonUrl || block.ctaButtonUrl || "/",
                  align: isCTAButtonAlignment(block.ctaSecondButtonAlign)
                    ? block.ctaSecondButtonAlign
                    : CTA_BUTTON_DEFAULT_ALIGNMENT,
                  style: getCTAButtonStyleVars(
                    block.ctaSecondButtonBg || block.ctaButtonBg,
                    block.ctaSecondButtonColor || block.ctaButtonColor,
                    block.ctaSecondButtonPadding ?? block.ctaButtonPadding,
                    block.ctaSecondButtonRadius ?? block.ctaButtonRadius,
                  ),
                },
              ]
            : []),
        ].filter((button) => button.label),
      );
      return (
        <section
          key={index}
          className="sbt-cta"
          style={{
            background: block.ctaBackgroundColor || CTA_SECTION_DEFAULT_BG,
            border: `${block.ctaBorderWidth ?? CTA_SECTION_DEFAULT_BORDER_WIDTH}px solid ${CTA_SECTION_BORDER_COLOR}`,
            borderRadius: 20,
            padding: "24px 28px",
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          {block.ctaTitle && (
            <TitleTag
              style={{
                marginBottom: 8,
                fontSize: CTA_LEVEL_FONT_SIZES[titleLevel],
              }}
            >
              {block.ctaTitle}
            </TitleTag>
          )}
          {block.ctaText && (
            <p
              style={{
                marginBottom: 16,
                color: "#495057",
                fontSize: CTA_LEVEL_FONT_SIZES[textLevel],
              }}
            >
              {block.ctaText}
            </p>
          )}
          {block.ctaButtonText && (
            <div
              className="sbt-cta-buttons"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                alignItems: "center",
                width: "100%",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: `${buttonGap}px`,
                  minWidth: 0,
                }}
              >
                {buttonLayout.leftButtons.map((button) => (
                  <a
                    key={button.key}
                    href={button.href}
                    className="cta-button btn sb-btn-primary"
                    style={button.style}
                  >
                    {button.label}
                  </a>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: `${buttonGap}px`,
                  minWidth: 0,
                }}
              >
                {buttonLayout.centerButtons.map((button) => (
                  <a
                    key={button.key}
                    href={button.href}
                    className="cta-button btn sb-btn-primary"
                    style={button.style}
                  >
                    {button.label}
                  </a>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  gap: `${buttonGap}px`,
                  minWidth: 0,
                }}
              >
                {buttonLayout.rightButtons.map((button) => (
                  <a
                    key={button.key}
                    href={button.href}
                    className="cta-button btn sb-btn-primary"
                    style={button.style}
                  >
                    {button.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      );
    }

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
  // Demote any <h1> in body content to <h2> — the page title is the only H1.
  const sanitized = sanitizeHtml(html).replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");
  const blocks = parseContentServer(sanitized);

  return (
    <>
      {blocks.map((block, index) => renderBlock(block, index))}
      <ContentFooter />
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
  const legacyCtaRegex =
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
  while ((match = legacyCtaRegex.exec(html)) !== null) {
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
    const headingMatch = /<(h[1-5])\b([^>]*)>([\s\S]*?)<\/\1>/i.exec(inner);
    const pMatch = /<p\b([^>]*)>([\s\S]*?)<\/p>/i.exec(inner);
    const headingTag = headingMatch?.[1]?.toLowerCase();
    const titleAttributes = headingMatch?.[2] || "";
    const textAttributes = pMatch?.[1] || "";
    const allAnchors = Array.from(
      inner.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi),
    );
    const primaryAnchorMatch = getCTAButtonMatch(allAnchors, "primary");
    const secondAnchorMatch = getCTAButtonMatch(allAnchors, "secondary");
    const primaryAnchorAttributes = primaryAnchorMatch?.[1] || "";
    const secondAnchorAttributes = secondAnchorMatch?.[1] || "";
    const secondAnchorText = secondAnchorMatch?.[2]?.trim() || "";
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      block: {
        type: "sbt-cta",
        content: "",
        ctaTitle: headingMatch?.[3]?.trim() || "",
        ctaText: pMatch?.[2]?.trim() || "",
        ctaTitleLevel: parseHeadingLevelAttribute(
          parseAttributeFromString(titleAttributes, "data-title-level"),
          levelFromLegacySize(
            parseAttributeFromString(titleAttributes, "data-title-size"),
          ) ?? (isHeadingLevel(headingTag) ? headingTag : "h2"),
        ),
        ctaTextLevel: parseHeadingLevelAttribute(
          parseAttributeFromString(textAttributes, "data-text-level"),
          levelFromLegacySize(
            parseAttributeFromString(textAttributes, "data-text-size"),
          ) ?? "h5",
        ),
        ctaBackgroundColor:
          parseAttributeFromString(
            `${match[1]} ${match[2]}`,
            "data-background-color",
          ) || undefined,
        ctaBorderWidth: parseOptionalNumericAttribute(
          parseAttributeFromString(
            `${match[1]} ${match[2]}`,
            "data-border-width",
          ),
        ),
        ctaButtonGap: parseOptionalNumericAttribute(
          parseAttributeFromString(
            `${match[1]} ${match[2]}`,
            "data-button-gap",
          ),
        ),
        ctaButtonText: primaryAnchorMatch?.[2]?.trim() || "",
        ctaButtonUrl:
          parseAttributeFromString(primaryAnchorAttributes, "href") || "/",
        ctaButtonAlign: isCTAButtonAlignment(
          parseAttributeFromString(
            primaryAnchorAttributes,
            "data-button-align",
          ),
        )
          ? (parseAttributeFromString(
              primaryAnchorAttributes,
              "data-button-align",
            ) as CTAButtonAlignment)
          : CTA_BUTTON_DEFAULT_ALIGNMENT,
        ctaButtonBg:
          parseAttributeFromString(primaryAnchorAttributes, "data-button-bg") ||
          undefined,
        ctaButtonColor:
          parseAttributeFromString(
            primaryAnchorAttributes,
            "data-button-color",
          ) || undefined,
        ctaButtonPadding: parseNumericAttribute(
          parseAttributeFromString(
            primaryAnchorAttributes,
            "data-button-padding",
          ),
          8,
        ),
        ctaButtonRadius: parseNumericAttribute(
          parseAttributeFromString(
            primaryAnchorAttributes,
            "data-button-radius",
          ),
          3,
        ),
        ctaShowSecondButton: !!secondAnchorMatch,
        ctaSecondButtonText: secondAnchorText || undefined,
        ctaSecondButtonUrl:
          parseAttributeFromString(secondAnchorAttributes, "href") || undefined,
        ctaSecondButtonAlign: isCTAButtonAlignment(
          parseAttributeFromString(secondAnchorAttributes, "data-button-align"),
        )
          ? (parseAttributeFromString(
              secondAnchorAttributes,
              "data-button-align",
            ) as CTAButtonAlignment)
          : CTA_BUTTON_DEFAULT_ALIGNMENT,
        ctaSecondButtonBg:
          parseAttributeFromString(
            secondAnchorAttributes,
            "data-second-button-bg",
          ) ||
          parseAttributeFromString(secondAnchorAttributes, "data-button-bg") ||
          undefined,
        ctaSecondButtonColor:
          parseAttributeFromString(
            secondAnchorAttributes,
            "data-second-button-color",
          ) ||
          parseAttributeFromString(
            secondAnchorAttributes,
            "data-button-color",
          ) ||
          undefined,
        ctaSecondButtonPadding: parseNumericAttribute(
          parseAttributeFromString(
            secondAnchorAttributes,
            "data-second-button-padding",
          ) ||
            parseAttributeFromString(
              secondAnchorAttributes,
              "data-button-padding",
            ),
          8,
        ),
        ctaSecondButtonRadius: parseNumericAttribute(
          parseAttributeFromString(
            secondAnchorAttributes,
            "data-second-button-radius",
          ) ||
            parseAttributeFromString(
              secondAnchorAttributes,
              "data-button-radius",
            ),
          3,
        ),
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
 * Utility: Convert JSX-style shared content blocks to HTML data attributes.
 */
export function convertContentToHtml(contentJsx: string): string {
  // This is a helper for migration.
  // Convert JSX patterns to data-attribute HTML.

  let html = contentJsx;

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

  // Convert self-closing CTA tags
  html = html.replace(
    /<(ArticleCTA|ContentCta)\s+([^>]*)\/>/g,
    '<section data-component="article-cta" $2></section>',
  );

  return html;
}
