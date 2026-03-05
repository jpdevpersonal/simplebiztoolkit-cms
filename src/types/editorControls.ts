/**
 * Editor Control Presets – approved block presets that appear in the
 * TipTap editor's "+ Insert Block" dropdown.
 *
 * These are NOT arbitrary code — they describe *parameters* for existing
 * TipTap node types (callout, ctaSbtBlock, imageBlock, paragraph).
 */

export type EditorControlBlockType = "paragraph" | "callout" | "cta" | "image";

export type EditorControlStatus = "draft" | "approved";

export interface EditorControlPreset {
  id: string;
  name: string;
  blockType: EditorControlBlockType;
  status: EditorControlStatus;

  // ── Callout fields ────────────────────────────────────────────────────
  calloutTone?: "info" | "warning" | "success";

  // ── CTA fields ────────────────────────────────────────────────────────
  ctaTitle?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;

  // ── Image fields ──────────────────────────────────────────────────────
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;

  // ── Timestamps ────────────────────────────────────────────────────────
  createdAt?: string;
  updatedAt?: string;
}
