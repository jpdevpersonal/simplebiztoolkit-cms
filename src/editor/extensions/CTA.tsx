/**
 * CTA – TipTap block node extension.
 *
 * An atomic (non-editable) call-to-action block. All content is stored as
 * node attributes and assembled into semantic HTML on serialisation.
 *
 * HTML output example:
 * <section class="sbt-cta" data-sbt-block="cta">
 *   <h2>Start Growing Your Business</h2>
 *   <p>Use the tools in SimpleBizToolkit.</p>
 *   <a href="/tools" class="cta-button">Try Now</a>
 * </section>
 */

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { LockedBadge } from "./LockedBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CTAAttrs {
  title: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
  buttonGap?: number | null;
  buttonAlign?: CTAButtonAlignment;
  titleLevel?: HeadingLevel;
  textLevel?: HeadingLevel;
  backgroundColor?: string | null;
  borderWidth?: number | null;
  showSecondButton?: boolean;
  secondButtonText?: string | null;
  secondButtonUrl?: string | null;
  secondButtonAlign?: CTAButtonAlignment;
  secondButtonBg?: string | null;
  secondButtonColor?: string | null;
  secondButtonPadding?: number | null;
  secondButtonRadius?: number | null;
}

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5";
type CTAButtonAlignment = "none" | "left" | "center" | "right";
type CTAButtonRole = "primary" | "secondary";

const CTA_HEADING_LEVELS: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5"];
const CTA_HEADING_OPTIONS: HeadingLevel[] = ["h2", "h3", "h4", "h5"];
const CTA_BUTTON_ALIGNMENT_OPTIONS: CTAButtonAlignment[] = [
  "none",
  "left",
  "center",
  "right",
];

const CTA_LEVEL_FONT_SIZES: Record<HeadingLevel, string> = {
  h1: "2.25rem",
  h2: "1.875rem",
  h3: "1.5rem",
  h4: "1.25rem",
  h5: "1.125rem",
};

const CTA_BUTTON_DEFAULT_BG = "#1a7f5a";
const CTA_BUTTON_DEFAULT_COLOR = "#ffffff";
const CTA_BUTTON_DEFAULT_PADDING = 14;
const CTA_BUTTON_DEFAULT_RADIUS = 10;
const CTA_BUTTON_DEFAULT_GAP = 16;
const CTA_BUTTON_DEFAULT_ALIGNMENT: CTAButtonAlignment = "none";
const CTA_SECOND_BUTTON_DEFAULT_ALIGNMENT: CTAButtonAlignment = "none";
const CTA_BUTTON_DEFAULT_PREVIEW_BG =
  "linear-gradient(135deg, #1a7f5a 0%, #0d5c3f 100%)";
const CTA_SECTION_DEFAULT_BG = "#f8f9fa";
const CTA_SECTION_DEFAULT_BORDER_WIDTH = 1;
const CTA_SECTION_BORDER_COLOR = "#dee2e6";
const CTA_BUTTON_WHITE_BORDER = "1px solid rgba(0, 0, 0, .2)";

type CTAButtonStyleVars = React.CSSProperties & Record<`--${string}`, string>;

function isHeadingLevel(value: unknown): value is HeadingLevel {
  return CTA_HEADING_LEVELS.includes(value as HeadingLevel);
}

function normalizeEditableHeadingLevel(
  level: HeadingLevel,
): Exclude<HeadingLevel, "h1"> {
  return level === "h1" ? "h2" : level;
}

function isCTAButtonAlignment(value: unknown): value is CTAButtonAlignment {
  return CTA_BUTTON_ALIGNMENT_OPTIONS.includes(value as CTAButtonAlignment);
}

function getCTAButtonElement(
  el: HTMLElement,
  role: CTAButtonRole,
): Element | null {
  const button = el.querySelector(`a[data-button-role="${role}"]`);
  if (button) return button;

  const anchors = el.querySelectorAll("a");
  return role === "primary" ? anchors[0] || null : anchors[1] || null;
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

function levelFromLegacySize(size: number | null | undefined): HeadingLevel {
  if (typeof size !== "number" || Number.isNaN(size)) return "h2";
  if (size >= 36) return "h1";
  if (size >= 28) return "h2";
  if (size >= 22) return "h3";
  if (size >= 18) return "h4";
  return "h5";
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

function getCTAButtonPreviewStyle(
  buttonBg?: string,
  buttonColor?: string,
  buttonPadding?: number,
  buttonRadius?: number,
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: isWhiteButtonBackground(buttonBg) ? CTA_BUTTON_WHITE_BORDER : 0,
    textDecoration: "none",
    whiteSpace: "nowrap",
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.01em",
    boxShadow: "0 6px 24px rgba(26, 127, 90, 0.2)",
    background: buttonBg || CTA_BUTTON_DEFAULT_PREVIEW_BG,
    color: buttonColor || CTA_BUTTON_DEFAULT_COLOR,
    padding:
      typeof buttonPadding === "number"
        ? `${buttonPadding}px`
        : "0.875rem 1.75rem",
    borderRadius:
      typeof buttonRadius === "number"
        ? `${buttonRadius}px`
        : `${CTA_BUTTON_DEFAULT_RADIUS}px`,
  };
}

// ─── Node View ────────────────────────────────────────────────────────────────

function CTAView({ node, updateAttributes }: NodeViewProps) {
  const {
    title,
    text,
    buttonText,
    buttonUrl,
    titleLevel,
    textLevel,
    backgroundColor,
    borderWidth,
  } = node.attrs as CTAAttrs;
  const showSecondButton = node.attrs.showSecondButton as boolean | undefined;
  const secondButtonText = node.attrs.secondButtonText as string | undefined;
  const secondButtonUrl = node.attrs.secondButtonUrl as string | undefined;
  const secondButtonBg = node.attrs.secondButtonBg as string | undefined;
  const secondButtonColor = node.attrs.secondButtonColor as string | undefined;
  const secondButtonPadding = node.attrs.secondButtonPadding as
    | number
    | undefined;
  const secondButtonRadius = node.attrs.secondButtonRadius as
    | number
    | undefined;
  const [isExpanded, setIsExpanded] = useState(false);
  const isLocked = node.attrs.locked === true;
  const lockReason = node.attrs.lockReason as string | null | undefined;
  const buttonBg = node.attrs.buttonBg as string | undefined;
  const buttonColor = node.attrs.buttonColor as string | undefined;
  const buttonGap = node.attrs.buttonGap as number | undefined;
  const buttonAlign = node.attrs.buttonAlign as CTAButtonAlignment | undefined;
  const buttonPadding = node.attrs.buttonPadding as number | undefined;
  const buttonRadius = node.attrs.buttonRadius as number | undefined;
  const secondButtonAlign = node.attrs.secondButtonAlign as
    | CTAButtonAlignment
    | undefined;
  const resolvedTitleLevel =
    titleLevel && isHeadingLevel(titleLevel) ? titleLevel : "h2";
  const resolvedTextLevel =
    textLevel && isHeadingLevel(textLevel) ? textLevel : "h5";
  const resolvedButtonGap =
    typeof buttonGap === "number" ? buttonGap : CTA_BUTTON_DEFAULT_GAP;
  const resolvedButtonAlign = isCTAButtonAlignment(buttonAlign)
    ? buttonAlign
    : CTA_BUTTON_DEFAULT_ALIGNMENT;
  const resolvedSecondButtonAlign = isCTAButtonAlignment(secondButtonAlign)
    ? secondButtonAlign
    : CTA_SECOND_BUTTON_DEFAULT_ALIGNMENT;
  const buttonPreviewStyle = getCTAButtonStyleVars(
    buttonBg,
    buttonColor,
    buttonPadding,
    buttonRadius,
  );
  const buttonPreviewDisplayStyle = getCTAButtonPreviewStyle(
    buttonBg,
    buttonColor,
    buttonPadding,
    buttonRadius,
  );

  const resolvedSecondButtonBg =
    typeof secondButtonBg === "string" ? secondButtonBg : buttonBg;
  const resolvedSecondButtonColor =
    typeof secondButtonColor === "string" ? secondButtonColor : buttonColor;
  const resolvedSecondButtonPadding =
    typeof secondButtonPadding === "number"
      ? secondButtonPadding
      : buttonPadding;
  const resolvedSecondButtonRadius =
    typeof secondButtonRadius === "number" ? secondButtonRadius : buttonRadius;

  const secondButtonPreviewStyle = getCTAButtonStyleVars(
    resolvedSecondButtonBg,
    resolvedSecondButtonColor,
    resolvedSecondButtonPadding,
    resolvedSecondButtonRadius,
  );
  const secondButtonPreviewDisplayStyle = getCTAButtonPreviewStyle(
    resolvedSecondButtonBg,
    resolvedSecondButtonColor,
    resolvedSecondButtonPadding,
    resolvedSecondButtonRadius,
  );
  const resolvedBackgroundColor = backgroundColor || CTA_SECTION_DEFAULT_BG;
  const resolvedBorderWidth =
    typeof borderWidth === "number"
      ? borderWidth
      : CTA_SECTION_DEFAULT_BORDER_WIDTH;
  const buttonLayout = getCTAButtonLayout(
    [
      {
        key: "primary" as const,
        label: buttonText || "Learn More",
        align: resolvedButtonAlign,
        style: {
          fontSize: "1.0625rem",
          ...buttonPreviewDisplayStyle,
          ...buttonPreviewStyle,
        } satisfies React.CSSProperties,
      },
      ...(showSecondButton
        ? [
            {
              key: "secondary" as const,
              label: secondButtonText || buttonText || "Learn More",
              align: resolvedSecondButtonAlign,
              style: {
                fontSize: "1.0625rem",
                ...secondButtonPreviewDisplayStyle,
                ...secondButtonPreviewStyle,
              } satisfies React.CSSProperties,
            },
          ]
        : []),
    ].filter((button) => button.label),
  );

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 8px",
    border: "1px solid #d1d5db",
    borderRadius: 3,
    fontSize: "0.8125rem",
    background: isLocked ? "#f3f4f6" : "#fff",
    cursor: isLocked ? "not-allowed" : "text",
    color: isLocked ? "#6b7280" : "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: 2,
    color: "#374151",
  };

  const controlsPanelStyle: React.CSSProperties = {
    display: "grid",
    gap: 16,
    marginTop: 12,
    padding: "14px 16px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  };

  const controlSectionStyle: React.CSSProperties = {
    display: "grid",
    gap: 10,
  };

  const controlRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "center",
  };

  const colorRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 2,
  };

  const dividerStyle: React.CSSProperties = {
    border: 0,
    borderTop: "1px solid #e5e7eb",
    margin: "4px 0",
  };

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        style={{
          border: "1px dashed #9ca3af",
          borderRadius: 6,
          padding: "12px 16px",
          background: "#f9fafb",
          margin: "12px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#6b7280",
            marginBottom: 10,
          }}
        >
          CTA Block
          {isLocked && <LockedBadge reason={lockReason} />}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? "Collapse CTA settings" : "Expand CTA settings"
            }
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#6b7280",
              background: "#e5e7eb",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "none",
              letterSpacing: "normal",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isExpanded ? "Hide settings" : "Settings"}
          </button>
        </div>

        {/* Style controls */}
        {isExpanded && (
          <>
            <div style={controlsPanelStyle}>
              <div style={controlSectionStyle}>
                <div style={sectionTitleStyle}>CTA section</div>
                <div style={colorRowStyle}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    CTA background
                  </label>
                  <input
                    type="color"
                    value={resolvedBackgroundColor}
                    onChange={(e) =>
                      updateAttributes({ backgroundColor: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 48,
                      height: 28,
                      border: "none",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={resolvedBackgroundColor}
                    onChange={(e) =>
                      updateAttributes({ backgroundColor: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 96,
                      fontSize: "0.8125rem",
                      padding: "4px 8px",
                    }}
                  />
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Border width (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={String(resolvedBorderWidth)}
                    onChange={(e) =>
                      updateAttributes({ borderWidth: Number(e.target.value) })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  />
                </div>
              </div>

              <div style={controlSectionStyle}>
                <div style={sectionTitleStyle}>Primary button</div>
                <div style={colorRowStyle}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    Button background
                  </label>
                  <input
                    type="color"
                    value={buttonBg || CTA_BUTTON_DEFAULT_BG}
                    onChange={(e) =>
                      updateAttributes({ buttonBg: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 48,
                      height: 28,
                      border: "none",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={buttonBg || CTA_BUTTON_DEFAULT_BG}
                    onChange={(e) =>
                      updateAttributes({ buttonBg: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 96,
                      fontSize: "0.8125rem",
                      padding: "4px 8px",
                    }}
                  />
                </div>

                <div style={colorRowStyle}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      width: 110,
                      flexShrink: 0,
                    }}
                  >
                    Button color
                  </label>
                  <input
                    type="color"
                    value={buttonColor || CTA_BUTTON_DEFAULT_COLOR}
                    onChange={(e) =>
                      updateAttributes({ buttonColor: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 48,
                      height: 28,
                      border: "none",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                  <input
                    type="text"
                    value={buttonColor || CTA_BUTTON_DEFAULT_COLOR}
                    onChange={(e) =>
                      updateAttributes({ buttonColor: e.target.value })
                    }
                    disabled={isLocked}
                    style={{
                      width: 96,
                      fontSize: "0.8125rem",
                      padding: "4px 8px",
                    }}
                  />
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Button spacing (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={String(resolvedButtonGap)}
                    onChange={(e) =>
                      updateAttributes({ buttonGap: Number(e.target.value) })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  />
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Button align
                  </label>
                  <select
                    value={resolvedButtonAlign}
                    onChange={(e) =>
                      updateAttributes({
                        buttonAlign: e.target.value as CTAButtonAlignment,
                      })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  >
                    {CTA_BUTTON_ALIGNMENT_OPTIONS.map((alignment) => (
                      <option key={alignment} value={alignment}>
                        {alignment === "none"
                          ? "None"
                          : alignment[0].toUpperCase() + alignment.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Padding (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={String(buttonPadding ?? CTA_BUTTON_DEFAULT_PADDING)}
                    onChange={(e) =>
                      updateAttributes({
                        buttonPadding: Number(e.target.value),
                      })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  />
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Radius (px)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={String(buttonRadius ?? CTA_BUTTON_DEFAULT_RADIUS)}
                    onChange={(e) =>
                      updateAttributes({ buttonRadius: Number(e.target.value) })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  />
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Show second button
                  </label>
                  <input
                    type="checkbox"
                    checked={!!showSecondButton}
                    onChange={(e) =>
                      updateAttributes({ showSecondButton: e.target.checked })
                    }
                    disabled={isLocked}
                    style={{ width: 20, height: 20 }}
                  />
                </div>
              </div>

              {showSecondButton && (
                <>
                  <hr style={dividerStyle} />
                  <div style={controlSectionStyle}>
                    <div style={sectionTitleStyle}>Second button</div>
                    <div style={colorRowStyle}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          width: 110,
                          flexShrink: 0,
                        }}
                      >
                        2nd button background
                      </label>
                      <input
                        type="color"
                        value={resolvedSecondButtonBg || CTA_BUTTON_DEFAULT_BG}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonBg: e.target.value || null,
                          })
                        }
                        disabled={isLocked}
                        style={{
                          width: 48,
                          height: 28,
                          border: "none",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                      <input
                        type="text"
                        value={resolvedSecondButtonBg || ""}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonBg: e.target.value || null,
                          })
                        }
                        disabled={isLocked}
                        style={{
                          width: 96,
                          fontSize: "0.8125rem",
                          padding: "4px 8px",
                        }}
                      />
                    </div>

                    <div style={colorRowStyle}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          width: 110,
                          flexShrink: 0,
                        }}
                      >
                        2nd button color
                      </label>
                      <input
                        type="color"
                        value={
                          resolvedSecondButtonColor || CTA_BUTTON_DEFAULT_COLOR
                        }
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonColor: e.target.value || null,
                          })
                        }
                        disabled={isLocked}
                        style={{
                          width: 48,
                          height: 28,
                          border: "none",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                      <input
                        type="text"
                        value={resolvedSecondButtonColor || ""}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonColor: e.target.value || null,
                          })
                        }
                        disabled={isLocked}
                        style={{
                          width: 96,
                          fontSize: "0.8125rem",
                          padding: "4px 8px",
                        }}
                      />
                    </div>

                    <div style={controlRowStyle}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          width: 110,
                        }}
                      >
                        2nd button align
                      </label>
                      <select
                        value={resolvedSecondButtonAlign}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonAlign: e.target
                              .value as CTAButtonAlignment,
                          })
                        }
                        disabled={isLocked}
                        style={{ width: 96, padding: "4px 8px" }}
                      >
                        {CTA_BUTTON_ALIGNMENT_OPTIONS.map((alignment) => (
                          <option key={alignment} value={alignment}>
                            {alignment === "none"
                              ? "None"
                              : alignment[0].toUpperCase() + alignment.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={controlRowStyle}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          width: 110,
                        }}
                      >
                        2nd padding (px)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={String(
                          resolvedSecondButtonPadding ??
                            buttonPadding ??
                            CTA_BUTTON_DEFAULT_PADDING,
                        )}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonPadding: Number(e.target.value),
                          })
                        }
                        disabled={isLocked}
                        style={{ width: 96, padding: "4px 8px" }}
                      />
                    </div>

                    <div style={controlRowStyle}>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          width: 110,
                        }}
                      >
                        2nd radius (px)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={String(
                          resolvedSecondButtonRadius ??
                            buttonRadius ??
                            CTA_BUTTON_DEFAULT_RADIUS,
                        )}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonRadius: Number(e.target.value),
                          })
                        }
                        disabled={isLocked}
                        style={{ width: 96, padding: "4px 8px" }}
                      />
                    </div>
                  </div>
                </>
              )}

              <hr style={dividerStyle} />

              <div style={controlSectionStyle}>
                <div style={sectionTitleStyle}>Typography</div>
                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Title size
                  </label>
                  <select
                    value={resolvedTitleLevel}
                    onChange={(e) =>
                      updateAttributes({
                        titleLevel: e.target.value as HeadingLevel,
                      })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  >
                    {CTA_HEADING_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={controlRowStyle}>
                  <label
                    style={{ fontSize: "0.75rem", fontWeight: 600, width: 110 }}
                  >
                    Subtitle size
                  </label>
                  <select
                    value={resolvedTextLevel}
                    onChange={(e) =>
                      updateAttributes({
                        textLevel: e.target.value as HeadingLevel,
                      })
                    }
                    disabled={isLocked}
                    style={{ width: 96, padding: "4px 8px" }}
                  >
                    {CTA_HEADING_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <span style={labelStyle}>Title</span>
                <input
                  type="text"
                  value={title || ""}
                  onChange={(e) => updateAttributes({ title: e.target.value })}
                  placeholder="Start Growing Your Business"
                  readOnly={isLocked}
                  style={fieldStyle}
                />
              </div>

              <div>
                <span style={labelStyle}>Supporting text</span>
                <input
                  type="text"
                  value={text || ""}
                  onChange={(e) => updateAttributes({ text: e.target.value })}
                  placeholder="Add a supporting description…"
                  readOnly={isLocked}
                  style={fieldStyle}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <span style={labelStyle}>Button label</span>
                  <input
                    type="text"
                    value={buttonText || ""}
                    onChange={(e) =>
                      updateAttributes({ buttonText: e.target.value })
                    }
                    placeholder="Try Now"
                    readOnly={isLocked}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <span style={labelStyle}>Button URL</span>
                  <input
                    type="text"
                    value={buttonUrl || ""}
                    onChange={(e) =>
                      updateAttributes({ buttonUrl: e.target.value })
                    }
                    placeholder="/tools"
                    readOnly={isLocked}
                    style={fieldStyle}
                  />
                </div>
              </div>

              {showSecondButton && (
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={labelStyle}>2nd button label</span>
                      <input
                        type="text"
                        value={secondButtonText || ""}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonText: e.target.value || null,
                          })
                        }
                        placeholder="Secondary"
                        readOnly={isLocked}
                        style={fieldStyle}
                      />
                    </div>
                    <div>
                      <span style={labelStyle}>2nd button URL</span>
                      <input
                        type="text"
                        value={secondButtonUrl || ""}
                        onChange={(e) =>
                          updateAttributes({
                            secondButtonUrl: e.target.value || null,
                          })
                        }
                        placeholder="/"
                        readOnly={isLocked}
                        style={fieldStyle}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Live preview */}
        <div
          style={{
            marginTop: 10,
            padding: "24px 28px",
            background: resolvedBackgroundColor,
            borderRadius: 20,
            border: `${resolvedBorderWidth}px solid ${CTA_SECTION_BORDER_COLOR}`,
            fontSize: "0.8125rem",
            color: "#374151",
            textAlign: "center",
          }}
        >
          <strong
            style={{ fontSize: CTA_LEVEL_FONT_SIZES[resolvedTitleLevel] }}
          >
            {title || "CTA Title"}
          </strong>
          {text && (
            <span style={{ fontSize: CTA_LEVEL_FONT_SIZES[resolvedTextLevel] }}>
              {` — ${text}`}
            </span>
          )}
          <div
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
                gap: `${resolvedButtonGap}px`,
                justifyContent: "flex-start",
                minWidth: 0,
              }}
            >
              {buttonLayout.leftButtons.map((button) => (
                <span
                  key={button.key}
                  className="btn sb-btn-primary"
                  style={button.style}
                >
                  {button.label}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: `${resolvedButtonGap}px`,
                justifyContent: "center",
                minWidth: 0,
              }}
            >
              {buttonLayout.centerButtons.map((button) => (
                <span
                  key={button.key}
                  className="btn sb-btn-primary"
                  style={button.style}
                >
                  {button.label}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: `${resolvedButtonGap}px`,
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              {buttonLayout.rightButtons.map((button) => (
                <span
                  key={button.key}
                  className="btn sb-btn-primary"
                  style={button.style}
                >
                  {button.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const CTA = Node.create({
  name: "ctaSbtBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: {
        default: "Start Growing Your Business",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("h2")?.textContent?.trim() ||
          el.getAttribute("data-title") ||
          "",
        renderHTML: () => ({}),
      },
      text: {
        default: "",
        parseHTML: (el: HTMLElement) =>
          el.querySelector("p")?.textContent?.trim() ||
          el.getAttribute("data-text") ||
          "",
        renderHTML: () => ({}),
      },
      titleLevel: {
        default: "h2",
        parseHTML: (el: HTMLElement) => {
          const heading = el.querySelector("h1, h2, h3, h4, h5");
          const explicitLevel = heading?.getAttribute("data-title-level");
          if (isHeadingLevel(explicitLevel)) {
            return normalizeEditableHeadingLevel(explicitLevel);
          }
          const legacySize = heading?.getAttribute("data-title-size");
          if (legacySize) {
            return normalizeEditableHeadingLevel(
              levelFromLegacySize(Number(legacySize)),
            );
          }
          if (heading && isHeadingLevel(heading.tagName.toLowerCase())) {
            return normalizeEditableHeadingLevel(
              heading.tagName.toLowerCase() as HeadingLevel,
            );
          }
          return "h2";
        },
        renderHTML: (attrs: { titleLevel?: HeadingLevel }) =>
          attrs.titleLevel && isHeadingLevel(attrs.titleLevel)
            ? {
                "data-title-level": normalizeEditableHeadingLevel(
                  attrs.titleLevel,
                ),
              }
            : {},
      },
      textLevel: {
        default: "h5",
        parseHTML: (el: HTMLElement) => {
          const paragraph = el.querySelector("p");
          const explicitLevel = paragraph?.getAttribute("data-text-level");
          if (isHeadingLevel(explicitLevel)) return explicitLevel;
          const legacySize = paragraph?.getAttribute("data-text-size");
          return levelFromLegacySize(legacySize ? Number(legacySize) : null);
        },
        renderHTML: (attrs: { textLevel?: HeadingLevel }) =>
          attrs.textLevel && isHeadingLevel(attrs.textLevel)
            ? { "data-text-level": attrs.textLevel }
            : {},
      },
      // existing attrs continue...
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-background-color") || null,
        renderHTML: (attrs: { backgroundColor?: string | null }) =>
          attrs.backgroundColor
            ? { "data-background-color": attrs.backgroundColor }
            : {},
      },
      borderWidth: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const value = el.getAttribute("data-border-width");
          return value ? Number(value) : null;
        },
        renderHTML: (attrs: { borderWidth?: number | null }) =>
          typeof attrs.borderWidth === "number"
            ? { "data-border-width": String(attrs.borderWidth) }
            : {},
      },
      buttonText: {
        default: "Learn More",
        parseHTML: (el: HTMLElement) =>
          getCTAButtonElement(el, "primary")?.textContent?.trim() ||
          el.getAttribute("data-button-text") ||
          "",
        renderHTML: () => ({}),
      },
      buttonUrl: {
        default: "/",
        parseHTML: (el: HTMLElement) =>
          getCTAButtonElement(el, "primary")?.getAttribute("href") ||
          el.getAttribute("data-button-url") ||
          "/",
        renderHTML: () => ({}),
      },
      buttonGap: {
        default: CTA_BUTTON_DEFAULT_GAP,
        parseHTML: (el: HTMLElement) => {
          const value = el.getAttribute("data-button-gap");
          return value ? Number(value) : CTA_BUTTON_DEFAULT_GAP;
        },
        renderHTML: (attrs: { buttonGap?: number | null }) =>
          typeof attrs.buttonGap === "number"
            ? { "data-button-gap": String(attrs.buttonGap) }
            : {},
      },
      buttonAlign: {
        default: CTA_BUTTON_DEFAULT_ALIGNMENT,
        parseHTML: (el: HTMLElement) => {
          const alignment = getCTAButtonElement(el, "primary")?.getAttribute(
            "data-button-align",
          );
          return isCTAButtonAlignment(alignment)
            ? alignment
            : CTA_BUTTON_DEFAULT_ALIGNMENT;
        },
        renderHTML: () => ({}),
      },
      // Inline style attributes for more granular control
      buttonBg: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          getCTAButtonElement(el, "primary")?.getAttribute("data-button-bg") ||
          getCTAButtonElement(el, "primary")?.getAttribute("data-bg") ||
          null,
        renderHTML: (attrs: { buttonBg?: string | null }) =>
          attrs.buttonBg ? { "data-button-bg": attrs.buttonBg } : {},
      },
      buttonColor: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          getCTAButtonElement(el, "primary")?.getAttribute(
            "data-button-color",
          ) ||
          getCTAButtonElement(el, "primary")?.getAttribute("data-color") ||
          null,
        renderHTML: (attrs: { buttonColor?: string | null }) =>
          attrs.buttonColor ? { "data-button-color": attrs.buttonColor } : {},
      },
      buttonPadding: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = getCTAButtonElement(el, "primary")?.getAttribute(
            "data-button-padding",
          );
          return v ? Number(v) : null;
        },
        renderHTML: (attrs: { buttonPadding?: number | null }) =>
          typeof attrs.buttonPadding === "number"
            ? { "data-button-padding": String(attrs.buttonPadding) }
            : {},
      },
      buttonRadius: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = getCTAButtonElement(el, "primary")?.getAttribute(
            "data-button-radius",
          );
          return v ? Number(v) : null;
        },
        renderHTML: (attrs: { buttonRadius?: number | null }) =>
          typeof attrs.buttonRadius === "number"
            ? { "data-button-radius": String(attrs.buttonRadius) }
            : {},
      },
      showSecondButton: {
        default: false,
        parseHTML: (el: HTMLElement) => {
          const anchors = el.querySelectorAll("a");
          return anchors.length > 1;
        },
        renderHTML: (attrs: { showSecondButton?: boolean }) =>
          attrs.showSecondButton ? { "data-show-second-button": "true" } : {},
      },
      secondButtonText: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          return (
            getCTAButtonElement(el, "secondary")?.textContent?.trim() || null
          );
        },
        renderHTML: (attrs: { secondButtonText?: string | null }) =>
          attrs.secondButtonText
            ? { "data-second-button-text": attrs.secondButtonText }
            : {},
      },
      secondButtonUrl: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          return (
            getCTAButtonElement(el, "secondary")?.getAttribute("href") || null
          );
        },
        renderHTML: (attrs: { secondButtonUrl?: string | null }) =>
          attrs.secondButtonUrl
            ? { "data-second-button-url": attrs.secondButtonUrl }
            : {},
      },
      secondButtonAlign: {
        default: CTA_SECOND_BUTTON_DEFAULT_ALIGNMENT,
        parseHTML: (el: HTMLElement) => {
          const alignment = getCTAButtonElement(el, "secondary")?.getAttribute(
            "data-button-align",
          );
          return isCTAButtonAlignment(alignment)
            ? alignment
            : CTA_SECOND_BUTTON_DEFAULT_ALIGNMENT;
        },
        renderHTML: () => ({}),
      },
      secondButtonBg: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          return (
            getCTAButtonElement(el, "secondary")?.getAttribute(
              "data-button-bg",
            ) ||
            getCTAButtonElement(el, "secondary")?.getAttribute("data-bg") ||
            null
          );
        },
        renderHTML: (attrs: { secondButtonBg?: string | null }) =>
          attrs.secondButtonBg
            ? { "data-second-button-bg": attrs.secondButtonBg }
            : {},
      },
      secondButtonColor: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          return (
            getCTAButtonElement(el, "secondary")?.getAttribute(
              "data-button-color",
            ) ||
            getCTAButtonElement(el, "secondary")?.getAttribute("data-color") ||
            null
          );
        },
        renderHTML: (attrs: { secondButtonColor?: string | null }) =>
          attrs.secondButtonColor
            ? { "data-second-button-color": attrs.secondButtonColor }
            : {},
      },
      secondButtonPadding: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = getCTAButtonElement(el, "secondary")?.getAttribute(
            "data-button-padding",
          );
          return v ? Number(v) : null;
        },
        renderHTML: (attrs: { secondButtonPadding?: number | null }) =>
          typeof attrs.secondButtonPadding === "number"
            ? {
                "data-second-button-padding": String(attrs.secondButtonPadding),
              }
            : {},
      },
      secondButtonRadius: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const v = getCTAButtonElement(el, "secondary")?.getAttribute(
            "data-button-radius",
          );
          return v ? Number(v) : null;
        },
        renderHTML: (attrs: { secondButtonRadius?: number | null }) =>
          typeof attrs.secondButtonRadius === "number"
            ? { "data-second-button-radius": String(attrs.secondButtonRadius) }
            : {},
      },
      locked: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-locked") === "true",
        renderHTML: (attrs: { locked?: boolean }) =>
          attrs.locked ? { "data-locked": "true" } : {},
      },
      lockReason: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          el.getAttribute("data-lock-reason") || null,
        renderHTML: (attrs: { lockReason?: string | null }) =>
          attrs.lockReason ? { "data-lock-reason": attrs.lockReason } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-sbt-block="cta"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Build nested semantic HTML from attributes.
    // `HTMLAttributes` carries data-locked / data-lock-reason when set.
    // ProseMirror's DOMOutputSpec supports nested child arrays at runtime,
    // even though the TypeScript type definition is restrictive — cast via any.
    const titleLevel = isHeadingLevel(node.attrs.titleLevel)
      ? node.attrs.titleLevel
      : "h2";
    const textLevel = isHeadingLevel(node.attrs.textLevel)
      ? node.attrs.textLevel
      : "h5";
    const buttonGap =
      typeof node.attrs.buttonGap === "number"
        ? node.attrs.buttonGap
        : CTA_BUTTON_DEFAULT_GAP;
    const buttonAlign = isCTAButtonAlignment(node.attrs.buttonAlign)
      ? node.attrs.buttonAlign
      : CTA_BUTTON_DEFAULT_ALIGNMENT;
    const secondButtonAlign = isCTAButtonAlignment(node.attrs.secondButtonAlign)
      ? node.attrs.secondButtonAlign
      : CTA_SECOND_BUTTON_DEFAULT_ALIGNMENT;
    const sectionStyle = [
      node.attrs.backgroundColor
        ? `background:${node.attrs.backgroundColor}`
        : null,
      typeof node.attrs.borderWidth === "number"
        ? `border:${node.attrs.borderWidth}px solid ${CTA_SECTION_BORDER_COLOR}`
        : null,
      "border-radius:20px",
      "padding:24px 28px",
      "margin:24px 0",
      "text-align:center",
    ]
      .filter(Boolean)
      .join("; ");
    const buttonStyle = [
      node.attrs.buttonBg ? `--sb-btn-bg:${node.attrs.buttonBg}` : null,
      node.attrs.buttonBg ? `--sb-btn-bg-hover:${node.attrs.buttonBg}` : null,
      node.attrs.buttonColor
        ? `--sb-btn-color:${node.attrs.buttonColor}`
        : null,
      typeof node.attrs.buttonPadding === "number"
        ? `--sb-btn-padding:${node.attrs.buttonPadding}px`
        : null,
      typeof node.attrs.buttonRadius === "number"
        ? `--sb-btn-radius:${node.attrs.buttonRadius}px`
        : null,
      isWhiteButtonBackground(node.attrs.buttonBg)
        ? `border:${CTA_BUTTON_WHITE_BORDER}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");

    const secondButtonStyle = [
      node.attrs.secondButtonBg || node.attrs.buttonBg
        ? `--sb-btn-bg:${node.attrs.secondButtonBg || node.attrs.buttonBg}`
        : null,
      node.attrs.secondButtonBg || node.attrs.buttonBg
        ? `--sb-btn-bg-hover:${node.attrs.secondButtonBg || node.attrs.buttonBg}`
        : null,
      node.attrs.secondButtonColor || node.attrs.buttonColor
        ? `--sb-btn-color:${node.attrs.secondButtonColor || node.attrs.buttonColor}`
        : null,
      typeof (node.attrs.secondButtonPadding ?? node.attrs.buttonPadding) ===
      "number"
        ? `--sb-btn-padding:${
            (node.attrs.secondButtonPadding ??
              node.attrs.buttonPadding) as number
          }px`
        : null,
      typeof (node.attrs.secondButtonRadius ?? node.attrs.buttonRadius) ===
      "number"
        ? `--sb-btn-radius:${
            (node.attrs.secondButtonRadius ?? node.attrs.buttonRadius) as number
          }px`
        : null,
      isWhiteButtonBackground(node.attrs.secondButtonBg || node.attrs.buttonBg)
        ? `border:${CTA_BUTTON_WHITE_BORDER}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
    const buttonLayout = getCTAButtonLayout(
      [
        {
          role: "primary" as const,
          align: buttonAlign,
          label: node.attrs.buttonText || "Learn More",
          href: node.attrs.buttonUrl || "/",
          style: buttonStyle,
          dataAttributes: {
            "data-button-role": "primary",
            ...(buttonAlign !== "none"
              ? { "data-button-align": buttonAlign }
              : {}),
            ...(node.attrs.buttonBg
              ? { "data-button-bg": node.attrs.buttonBg }
              : {}),
            ...(node.attrs.buttonColor
              ? { "data-button-color": node.attrs.buttonColor }
              : {}),
            ...(node.attrs.buttonPadding
              ? { "data-button-padding": String(node.attrs.buttonPadding) }
              : {}),
            ...(node.attrs.buttonRadius
              ? { "data-button-radius": String(node.attrs.buttonRadius) }
              : {}),
          },
        },
        ...(node.attrs.showSecondButton || node.attrs.secondButtonText
          ? [
              {
                role: "secondary" as const,
                align: secondButtonAlign,
                label:
                  node.attrs.secondButtonText ||
                  node.attrs.buttonText ||
                  "Learn More",
                href: node.attrs.secondButtonUrl || node.attrs.buttonUrl || "/",
                style: secondButtonStyle,
                dataAttributes: {
                  "data-button-role": "secondary",
                  ...(secondButtonAlign !== "none"
                    ? { "data-button-align": secondButtonAlign }
                    : {}),
                  ...(node.attrs.secondButtonBg
                    ? { "data-button-bg": node.attrs.secondButtonBg }
                    : {}),
                  ...(node.attrs.secondButtonColor
                    ? {
                        "data-button-color": node.attrs.secondButtonColor,
                      }
                    : {}),
                  ...(node.attrs.secondButtonPadding
                    ? {
                        "data-button-padding": String(
                          node.attrs.secondButtonPadding,
                        ),
                      }
                    : {}),
                  ...(node.attrs.secondButtonRadius
                    ? {
                        "data-button-radius": String(
                          node.attrs.secondButtonRadius,
                        ),
                      }
                    : {}),
                },
              },
            ]
          : []),
      ].filter((button) => button.label),
    );
    const buttonGroupStyle = [
      "display:grid",
      "grid-template-columns:minmax(0, 1fr) auto minmax(0, 1fr)",
      "align-items:center",
      "width:100%",
      "margin-top:12px",
    ].join("; ");
    const leftButtonGroupStyle = [
      "display:flex",
      "flex-wrap:wrap",
      "justify-content:flex-start",
      `gap:${buttonGap}px`,
      "min-width:0",
    ].join("; ");
    const centerButtonGroupStyle = [
      "display:flex",
      "flex-wrap:wrap",
      "justify-content:center",
      `gap:${buttonGap}px`,
      "min-width:0",
    ].join("; ");
    const rightButtonGroupStyle = [
      "display:flex",
      "flex-wrap:wrap",
      "justify-content:flex-end",
      `gap:${buttonGap}px`,
      "min-width:0",
    ].join("; ");

    return [
      "section",
      mergeAttributes(
        {
          "data-sbt-block": "cta",
          class: "sbt-cta",
          style: sectionStyle,
        },
        HTMLAttributes,
      ),
      [
        titleLevel,
        mergeAttributes({
          style: `font-size:${CTA_LEVEL_FONT_SIZES[titleLevel]}`,
          "data-title-level": titleLevel,
        }),
        node.attrs.title || "",
      ],
      [
        "p",
        mergeAttributes({
          style: `font-size:${CTA_LEVEL_FONT_SIZES[textLevel]}`,
          "data-text-level": textLevel,
        }),
        node.attrs.text || "",
      ],
      [
        "div",
        {
          class: "sbt-cta-buttons",
          style: buttonGroupStyle,
        },
        [
          "div",
          { style: leftButtonGroupStyle },
          ...buttonLayout.leftButtons.map((button) => [
            "a",
            mergeAttributes(
              {
                href: button.href,
                class: "cta-button btn sb-btn-primary",
                ...(button.style ? { style: button.style } : {}),
              },
              button.dataAttributes,
            ),
            button.label,
          ]),
        ],
        [
          "div",
          { style: centerButtonGroupStyle },
          ...buttonLayout.centerButtons.map((button) => [
            "a",
            mergeAttributes(
              {
                href: button.href,
                class: "cta-button btn sb-btn-primary",
                ...(button.style ? { style: button.style } : {}),
              },
              button.dataAttributes,
            ),
            button.label,
          ]),
        ],
        [
          "div",
          { style: rightButtonGroupStyle },
          ...buttonLayout.rightButtons.map((button) => [
            "a",
            mergeAttributes(
              {
                href: button.href,
                class: "cta-button btn sb-btn-primary",
                ...(button.style ? { style: button.style } : {}),
              },
              button.dataAttributes,
            ),
            button.label,
          ]),
        ],
      ],
    ] as unknown as [string, Record<string, string>];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTAView);
  },
});
