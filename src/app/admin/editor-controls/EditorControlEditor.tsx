/**
 * EditorControlEditor – Client component for creating / editing an
 * editor control preset.  Follows the same form pattern used by
 * MenuItemEditor, ProductEditor, etc.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  EditorControlBlockType,
  EditorControlPreset,
  EditorControlStatus,
} from "@/types/editorControls";
import { clientApi } from "@/lib/clientApi";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

type Props = {
  control?: EditorControlPreset;
  isNew?: boolean;
};

const BLOCK_TYPES: { value: EditorControlBlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "callout", label: "Callout" },
  { value: "cta", label: "CTA" },
  { value: "image", label: "Image" },
];

const CALLOUT_TONES = ["info", "warning", "success"] as const;

export default function EditorControlEditor({ control, isNew = false }: Props) {
  const router = useRouter();

  const [name, setName] = useState(control?.name ?? "");
  const [blockType, setBlockType] = useState<EditorControlBlockType>(
    control?.blockType ?? "paragraph",
  );
  const [status, setStatus] = useState<EditorControlStatus>(
    control?.status ?? "draft",
  );

  // Callout
  const [calloutTone, setCalloutTone] = useState(
    control?.calloutTone ?? "info",
  );

  // CTA
  const [ctaTitle, setCtaTitle] = useState(control?.ctaTitle ?? "");
  const [ctaText, setCtaText] = useState(control?.ctaText ?? "");
  const [ctaButtonText, setCtaButtonText] = useState(
    control?.ctaButtonText ?? "",
  );
  const [ctaButtonUrl, setCtaButtonUrl] = useState(control?.ctaButtonUrl ?? "");

  // Image
  const [imageSrc, setImageSrc] = useState(control?.imageSrc ?? "");
  const [imageAlt, setImageAlt] = useState(control?.imageAlt ?? "");
  const [imageCaption, setImageCaption] = useState(control?.imageCaption ?? "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildPayload(): Partial<EditorControlPreset> {
    const base: Partial<EditorControlPreset> = { name, blockType, status };
    if (blockType === "callout") {
      base.calloutTone = calloutTone as EditorControlPreset["calloutTone"];
    }
    if (blockType === "cta") {
      base.ctaTitle = ctaTitle || undefined;
      base.ctaText = ctaText || undefined;
      base.ctaButtonText = ctaButtonText || undefined;
      base.ctaButtonUrl = ctaButtonUrl || undefined;
    }
    if (blockType === "image") {
      base.imageSrc = imageSrc || undefined;
      base.imageAlt = imageAlt || undefined;
      base.imageCaption = imageCaption || undefined;
    }
    return base;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = buildPayload();
      if (isNew) {
        const created = await clientApi.createEditorControl(payload);
        router.push(
          `/admin/editor-controls/${(created as EditorControlPreset).id}/edit`,
        );
        router.refresh();
      } else if (control?.id) {
        await clientApi.updateEditorControl(control.id, payload);
        setMessage("Editor control saved successfully!");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this editor control?"))
      return;
    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      await clientApi.deleteEditorControl(control!.id);
      router.push("/admin/editor-controls");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  // ── Icons ─────────────────────────────────────────────────────────────────

  const detailsIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12h18M3 6h18M3 18h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const settingsIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const publishIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit}>
      <EditorFeedback message={message} error={error} />

      {/* ── Core details ─────────────────────────────────────────────── */}
      <AdminFormBlock icon={detailsIcon} title="Control Details">
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">Name *</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product CTA, Info Callout"
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Block Type</label>
            <select
              className="form-select"
              value={blockType}
              onChange={(e) =>
                setBlockType(e.target.value as EditorControlBlockType)
              }
            >
              {BLOCK_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminFormBlock>

      {/* ── Block-specific defaults ──────────────────────────────────── */}
      {blockType === "callout" && (
        <AdminFormBlock icon={settingsIcon} title="Callout Defaults">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Tone</label>
              <select
                className="form-select"
                value={calloutTone}
                onChange={(e) =>
                  setCalloutTone(
                    e.target.value as (typeof CALLOUT_TONES)[number],
                  )
                }
              >
                {CALLOUT_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AdminFormBlock>
      )}

      {blockType === "cta" && (
        <AdminFormBlock icon={settingsIcon} title="CTA Defaults">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Title</label>
              <input
                className="form-control"
                value={ctaTitle}
                onChange={(e) => setCtaTitle(e.target.value)}
                placeholder="Start Growing Your Business"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Text</label>
              <input
                className="form-control"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Use the tools in SimpleBizToolkit."
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Button Text</label>
              <input
                className="form-control"
                value={ctaButtonText}
                onChange={(e) => setCtaButtonText(e.target.value)}
                placeholder="Try Now"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Button URL</label>
              <input
                className="form-control"
                value={ctaButtonUrl}
                onChange={(e) => setCtaButtonUrl(e.target.value)}
                placeholder="/"
              />
            </div>
          </div>
        </AdminFormBlock>
      )}

      {blockType === "image" && (
        <AdminFormBlock icon={settingsIcon} title="Image Defaults">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">Image URL</label>
              <input
                className="form-control"
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                placeholder="/images/example.jpg"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Alt Text</label>
              <input
                className="form-control"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of image"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Caption</label>
              <input
                className="form-control"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Optional caption"
              />
            </div>
          </div>
        </AdminFormBlock>
      )}

      {/* ── Status ───────────────────────────────────────────────────── */}
      <AdminFormBlock icon={publishIcon} title="Approval">
        <div className="mb-0">
          <label className="form-label fw-semibold">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as EditorControlStatus)}
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
          <div className="form-text">
            Only <strong>Approved</strong> controls appear in the editor&apos;s
            &ldquo;Insert Block&rdquo; dropdown.
          </div>
        </div>
      </AdminFormBlock>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <EditorActions
        saving={saving}
        isCreateMode={isNew}
        entityName="Editor Control"
        onCancel={() => router.push("/admin/editor-controls")}
        onDelete={!isNew && control ? handleDelete : undefined}
        deleting={deleting}
      />
    </form>
  );
}
