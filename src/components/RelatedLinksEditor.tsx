"use client";

import { useEffect, useMemo, useState } from "react";
import CmsImagePicker from "@/components/CmsImagePicker";
import RelatedLinksBlock from "@/components/RelatedLinksBlock";
import { clientApi } from "@/lib/clientApi";
import { type ImageAsset } from "@/lib/imageApi";
import { toTemplatesRoute } from "@/lib/templatesRoute";
import {
  createRelatedLinkUid,
  isCustomRelatedLinkHref,
  normalizeRelatedLinksBorderWidth,
  normalizeRelatedLinkImagePositionY,
  normalizeRelatedLinksDraftItems,
  normalizeRelatedLinksImageSize,
  normalizeRelatedLinksTitle,
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  RELATED_LINKS_DEFAULT_IMAGE_SIZE,
  RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y,
  RELATED_LINKS_MAX_ITEMS,
  sanitizeRelatedLinksItems,
  type RelatedLinkItem,
  type RelatedLinkKind,
  type RelatedLinksBlockData,
} from "@/lib/relatedLinks";

const IMAGE_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium (1.5x)" },
  { value: "large", label: "Large (2x)" },
  { value: "extra-large", label: "Extra large (3x)" },
] as const;

const RELATED_LINKS_MIN_IMAGE_DIMENSION = 288;
const THUMBNAIL_POSITION_PRESETS = [
  { label: "Top", value: 0 },
  { label: "Center", value: RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y },
  { label: "Bottom", value: 100 },
] as const;

type DestinationOption = {
  value: string;
  kind: RelatedLinkKind;
  refId: string;
  href: string;
  label: string;
  thumbnailUrl?: string;
};

type RelatedLinksEditorProps = {
  value: Partial<RelatedLinksBlockData>;
  onChange: (nextValue: RelatedLinksBlockData) => void;
  disabled?: boolean;
  previewVariant?: "content" | "template";
  previewHint?: string;
  className?: string;
};

function makeOptionValue(kind: RelatedLinkKind, refId: string): string {
  return `${kind}:${refId}`;
}

function getDestinationLabel(item: RelatedLinkItem): string {
  return item.label?.trim() || item.destinationTitle;
}

function getThumbnailPositionLabel(positionY?: number | null): string {
  const normalized = normalizeRelatedLinkImagePositionY(positionY);

  if (normalized <= 15) {
    return "Top";
  }

  if (normalized >= 85) {
    return "Bottom";
  }

  return "Custom";
}

function normalizeEditorBlock(
  value: Partial<RelatedLinksBlockData>,
): RelatedLinksBlockData {
  return {
    title: normalizeRelatedLinksTitle(value.title),
    items: normalizeRelatedLinksDraftItems(value.items),
    backgroundColor:
      typeof value.backgroundColor === "string" && value.backgroundColor.trim()
        ? value.backgroundColor.trim()
        : RELATED_LINKS_DEFAULT_BACKGROUND,
    borderWidth:
      normalizeRelatedLinksBorderWidth(value.borderWidth) ??
      RELATED_LINKS_DEFAULT_BORDER_WIDTH,
    imageSize: normalizeRelatedLinksImageSize(value.imageSize),
  };
}

export default function RelatedLinksEditor({
  value,
  onChange,
  disabled = false,
  previewVariant = "content",
  previewHint = "Preview updates as you build the block.",
  className,
}: RelatedLinksEditorProps) {
  const block = normalizeEditorBlock(value);
  const previewItems = sanitizeRelatedLinksItems(block.items);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageOptions, setPageOptions] = useState<DestinationOption[]>([]);
  const [templateOptions, setTemplateOptions] = useState<DestinationOption[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [pages, categories] = await Promise.all([
          clientApi.getMenuItemPages(undefined, "published"),
          clientApi.getProductCategories(),
        ]);

        if (cancelled) {
          return;
        }

        const nextPageOptions = pages
          .filter((page) => page.status === "published")
          .map((page) => ({
            value: makeOptionValue("page", page.id),
            kind: "page" as const,
            refId: page.id,
            href: `/${page.slug}`,
            label: page.title,
          }))
          .sort((left, right) => left.label.localeCompare(right.label));

        const nextTemplateOptions = categories
          .flatMap((category) =>
            (category.items || [])
              .filter((item) => item.status === "published")
              .map((item) => ({
                value: makeOptionValue("template", item.id),
                kind: "template" as const,
                refId: item.id,
                href:
                  toTemplatesRoute(item.productPageUrl) ||
                  `/templates/${category.slug}/${item.slug}`,
                label: item.title,
                thumbnailUrl: item.image || undefined,
              })),
          )
          .sort((left, right) => left.label.localeCompare(right.label));

        setPageOptions(nextPageOptions);
        setTemplateOptions(nextTemplateOptions);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load destinations.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const optionsByValue = useMemo(() => {
    return new Map(
      [...pageOptions, ...templateOptions].map((option) => [
        option.value,
        option,
      ]),
    );
  }, [pageOptions, templateOptions]);

  const updateBlock = (nextValue: Partial<RelatedLinksBlockData>) => {
    onChange(
      normalizeEditorBlock({
        ...block,
        ...nextValue,
      }),
    );
  };

  const updateItems = (nextItems: RelatedLinkItem[]) => {
    updateBlock({ items: nextItems });
  };

  const handleKindChange = (uid: string, kind: RelatedLinkKind) => {
    updateItems(
      block.items.map((item) => {
        if (item.uid !== uid || item.kind === kind) {
          return item;
        }

        return {
          ...item,
          kind,
          refId: "",
          href: "",
          destinationTitle: "",
        };
      }),
    );
  };

  const handleDestinationChange = (uid: string, optionValue: string) => {
    const option = optionsByValue.get(optionValue);
    updateItems(
      block.items.map((item) => {
        if (item.uid !== uid) {
          return item;
        }

        if (!option) {
          return {
            ...item,
            refId: "",
            href: "",
            destinationTitle: "",
          };
        }

        // When a template is selected, auto-populate the thumbnail from the
        // template's own image — unless the user manually picked an image via
        // the CMS picker (indicated by a non-null imageId).
        // Default to top-aligned (0%) so the top portion of the template page
        // is visible in the square crop rather than the centre.
        const autoImageFields =
          option.kind === "template" && option.thumbnailUrl && !item.imageId
            ? {
                imageId: null,
                imageUrl: option.thumbnailUrl,
                imageAlt: null,
                imagePositionY: 0,
              }
            : {};

        return {
          ...item,
          kind: option.kind,
          refId: option.refId,
          href: option.href,
          destinationTitle: option.label,
          ...autoImageFields,
        };
      }),
    );
  };

  const handleCustomHrefChange = (uid: string, href: string) => {
    const trimmed = href.trim();
    updateItems(
      block.items.map((item) =>
        item.uid === uid
          ? {
              ...item,
              refId: "",
              href: trimmed,
              destinationTitle: trimmed,
            }
          : item,
      ),
    );
  };

  const handleLabelChange = (uid: string, label: string) => {
    updateItems(
      block.items.map((item) => (item.uid === uid ? { ...item, label } : item)),
    );
  };

  const handleImageChange = (uid: string, image: ImageAsset | null) => {
    updateItems(
      block.items.map((item) =>
        item.uid === uid
          ? {
              ...item,
              imageId: image?.id ?? null,
              imageUrl: image?.url ?? null,
              imageAlt: image?.altText ?? null,
              imagePositionY:
                image !== null
                  ? normalizeRelatedLinkImagePositionY(item.imagePositionY)
                  : RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y,
            }
          : item,
      ),
    );
  };

  const handleImagePositionChange = (uid: string, imagePositionY: number) => {
    updateItems(
      block.items.map((item) =>
        item.uid === uid
          ? {
              ...item,
              imagePositionY:
                normalizeRelatedLinkImagePositionY(imagePositionY),
            }
          : item,
      ),
    );
  };

  const moveItem = (uid: string, direction: -1 | 1) => {
    const index = block.items.findIndex((item) => item.uid === uid);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= block.items.length) {
      return;
    }

    const nextItems = block.items.slice();
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, item);
    updateItems(nextItems);
  };

  const addItem = () => {
    if (block.items.length >= RELATED_LINKS_MAX_ITEMS) {
      return;
    }

    updateItems([
      ...block.items,
      {
        uid: createRelatedLinkUid(),
        kind: "page",
        refId: "",
        href: "",
        destinationTitle: "",
        label: null,
        imageId: null,
        imageUrl: null,
        imageAlt: null,
        imagePositionY: RELATED_LINKS_DEFAULT_IMAGE_POSITION_Y,
      },
    ]);
  };

  const removeItem = (uid: string) => {
    updateItems(block.items.filter((item) => item.uid !== uid));
  };

  return (
    <div className={`related-links-editor${className ? ` ${className}` : ""}`}>
      <div className="related-links-editor-hero">
        <section className="related-links-editor-panel related-links-editor-panel--preview">
          <div className="related-links-editor-panel-header">
            <div>
              <div className="related-links-editor-eyebrow">Live Preview</div>
              <h3 className="related-links-editor-panel-title">
                How it will look
              </h3>
              <p className="related-links-editor-panel-copy">{previewHint}</p>
            </div>
            <span className="related-links-editor-count-pill">
              {previewItems.length}/{RELATED_LINKS_MAX_ITEMS} ready
            </span>
          </div>

          {previewItems.length > 0 ? (
            <div className="related-links-editor-preview-frame">
              <RelatedLinksBlock
                title={block.title}
                items={previewItems}
                backgroundColor={block.backgroundColor}
                borderWidth={block.borderWidth}
                imageSize={block.imageSize}
                variant={previewVariant}
              />
            </div>
          ) : (
            <div className="related-links-editor-empty-preview">
              Choose a page, template, or custom URL to build the preview.
            </div>
          )}
        </section>

        <section className="related-links-editor-panel related-links-editor-panel--controls">
          <div className="related-links-editor-panel-header">
            <div>
              <div className="related-links-editor-eyebrow">Block Settings</div>
              <h3 className="related-links-editor-panel-title">
                Section styling
              </h3>
              <p className="related-links-editor-panel-copy">
                Links always open in the same window.
              </p>
            </div>
          </div>

          <div className="related-links-editor-control-grid">
            <label className="related-links-editor-control related-links-editor-control--wide">
              <span className="related-links-editor-label">Heading</span>
              <input
                type="text"
                value={block.title}
                onChange={(event) =>
                  updateBlock({
                    title: normalizeRelatedLinksTitle(event.target.value),
                  })
                }
                disabled={disabled}
                className="related-links-editor-field"
              />
            </label>

            <label className="related-links-editor-control">
              <span className="related-links-editor-label">Background</span>
              <input
                type="color"
                value={
                  block.backgroundColor || RELATED_LINKS_DEFAULT_BACKGROUND
                }
                onChange={(event) =>
                  updateBlock({ backgroundColor: event.target.value })
                }
                disabled={disabled}
                className="related-links-editor-color"
              />
            </label>

            <label className="related-links-editor-control">
              <span className="related-links-editor-label">Border width</span>
              <input
                type="number"
                min={0}
                max={12}
                value={String(
                  block.borderWidth ?? RELATED_LINKS_DEFAULT_BORDER_WIDTH,
                )}
                onChange={(event) =>
                  updateBlock({ borderWidth: Number(event.target.value) })
                }
                disabled={disabled}
                className="related-links-editor-field"
              />
            </label>

            <label className="related-links-editor-control">
              <span className="related-links-editor-label">Image size</span>
              <select
                value={block.imageSize || RELATED_LINKS_DEFAULT_IMAGE_SIZE}
                onChange={(event) =>
                  updateBlock({
                    imageSize: normalizeRelatedLinksImageSize(
                      event.target.value,
                    ),
                  })
                }
                disabled={disabled}
                className="related-links-editor-field"
              >
                {IMAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <section className="related-links-editor-panel related-links-editor-panel--items">
        <div className="related-links-editor-toolbar">
          <div className="related-links-editor-toolbar-copy">
            <div className="related-links-editor-eyebrow">Links</div>
            <h3 className="related-links-editor-panel-title">
              Manage destinations
            </h3>
            <p className="related-links-editor-panel-copy">
              Add up to {RELATED_LINKS_MAX_ITEMS} internal pages, templates, or
              custom URLs, then optionally attach a thumbnail.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={
              disabled ||
              block.items.length >= RELATED_LINKS_MAX_ITEMS ||
              isLoading
            }
            className="related-links-editor-add"
          >
            Add link
          </button>
        </div>

        {isLoading ? (
          <p className="related-links-editor-note">Loading destinations…</p>
        ) : null}

        {loadError ? (
          <p className="related-links-editor-note related-links-editor-note--error">
            {loadError}
          </p>
        ) : null}

        {block.items.length === 0 ? (
          <div className="related-links-editor-empty-state">
            Start with one link. You can reorder them any time, and each item
            can use its own optional thumbnail.
          </div>
        ) : (
          <div className="related-links-editor-list">
            {block.items.map((item, index) => {
              const isReady =
                item.kind === "custom"
                  ? isCustomRelatedLinkHref(item.href)
                  : Boolean(item.refId && item.href && item.destinationTitle);
              const currentOptions =
                item.kind === "template" ? templateOptions : pageOptions;
              const selectedValue = item.refId
                ? makeOptionValue(item.kind, item.refId)
                : "";
              const thumbnailPositionY = normalizeRelatedLinkImagePositionY(
                item.imagePositionY,
              );

              return (
                <article key={item.uid} className="related-links-editor-item">
                  <div className="related-links-editor-item-header">
                    <div className="related-links-editor-item-heading">
                      <span className="related-links-editor-item-index">
                        Link {index + 1}
                      </span>
                      <span
                        className={`related-links-editor-status${isReady ? " related-links-editor-status--ready" : " related-links-editor-status--incomplete"}`}
                      >
                        {isReady
                          ? "Ready"
                          : item.kind === "custom"
                            ? "Enter a URL"
                            : "Choose a destination"}
                      </span>
                    </div>

                    <div className="related-links-editor-item-actions">
                      <button
                        type="button"
                        onClick={() => moveItem(item.uid, -1)}
                        disabled={disabled || index === 0}
                        className="related-links-editor-icon-btn"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.uid, 1)}
                        disabled={disabled || index === block.items.length - 1}
                        className="related-links-editor-icon-btn"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.uid)}
                        disabled={disabled}
                        className="related-links-editor-icon-btn related-links-editor-icon-btn--danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="related-links-editor-item-body">
                    <div className="related-links-editor-fields">
                      <div>
                        <span className="related-links-editor-label">
                          Link type
                        </span>
                        <div className="related-links-editor-kind-toggle">
                          <button
                            type="button"
                            onClick={() => handleKindChange(item.uid, "page")}
                            disabled={disabled}
                            className={`related-links-editor-kind-button${item.kind === "page" ? " is-active" : ""}`}
                          >
                            Page
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleKindChange(item.uid, "template")
                            }
                            disabled={disabled}
                            className={`related-links-editor-kind-button${item.kind === "template" ? " is-active" : ""}`}
                          >
                            Template
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKindChange(item.uid, "custom")}
                            disabled={disabled}
                            className={`related-links-editor-kind-button${item.kind === "custom" ? " is-active" : ""}`}
                          >
                            Custom URL
                          </button>
                        </div>
                      </div>

                      {item.kind === "custom" ? (
                        <div>
                          <label
                            className="related-links-editor-label"
                            htmlFor={`${item.uid}-custom-url`}
                          >
                            Custom URL
                          </label>
                          <input
                            id={`${item.uid}-custom-url`}
                            type="text"
                            value={item.href}
                            onChange={(event) =>
                              handleCustomHrefChange(
                                item.uid,
                                event.target.value,
                              )
                            }
                            disabled={disabled}
                            placeholder="https://example.com/page or /internal-path"
                            className="related-links-editor-field"
                          />
                          <div className="related-links-editor-helper">
                            {item.href && !isCustomRelatedLinkHref(item.href)
                              ? "Enter a URL like example.com, https://example.com, or an internal path starting with /."
                              : "Link to any URL, including external sites."}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label
                            className="related-links-editor-label"
                            htmlFor={`${item.uid}-destination`}
                          >
                            {item.kind === "template"
                              ? "Choose template"
                              : "Choose page"}
                          </label>
                          <select
                            id={`${item.uid}-destination`}
                            value={selectedValue}
                            onChange={(event) =>
                              handleDestinationChange(
                                item.uid,
                                event.target.value,
                              )
                            }
                            disabled={disabled || isLoading}
                            className="related-links-editor-field"
                          >
                            <option value="">
                              {item.kind === "template"
                                ? "Select a template"
                                : "Select a page"}
                            </option>
                            {currentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="related-links-editor-helper">
                            {selectedValue && optionsByValue.get(selectedValue)
                              ? `${item.kind === "template" ? "Template" : "Page"}: ${optionsByValue.get(selectedValue)?.href}`
                              : `Only published ${item.kind === "template" ? "templates" : "pages"} are shown here.`}
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          className="related-links-editor-label"
                          htmlFor={`${item.uid}-label`}
                        >
                          Visible label
                        </label>
                        <input
                          id={`${item.uid}-label`}
                          type="text"
                          value={item.label || ""}
                          onChange={(event) =>
                            handleLabelChange(item.uid, event.target.value)
                          }
                          disabled={disabled}
                          className="related-links-editor-field"
                        />
                        <div className="related-links-editor-helper">
                          Shown as:{" "}
                          {getDestinationLabel(item) ||
                            (item.kind === "custom"
                              ? "Enter a URL first"
                              : "Select a destination first")}
                        </div>
                      </div>
                    </div>

                    <div className="related-links-editor-thumbnail">
                      <div className="related-links-editor-thumbnail-copy">
                        <div className="related-links-editor-label">
                          Thumbnail
                        </div>
                        <div className="related-links-editor-helper">
                          Optional square image displayed beside the link. Use
                          at least {RELATED_LINKS_MIN_IMAGE_DIMENSION}x
                          {RELATED_LINKS_MIN_IMAGE_DIMENSION} for sharper
                          thumbnails.
                        </div>
                      </div>
                      <CmsImagePicker
                        label={`link ${index + 1} image`}
                        value={item.imageUrl}
                        selectedImageId={item.imageId}
                        minimumImageDimensions={{
                          width: RELATED_LINKS_MIN_IMAGE_DIMENSION,
                          height: RELATED_LINKS_MIN_IMAGE_DIMENSION,
                          label: "Related link thumbnails",
                        }}
                        modalAdditionalContent={
                          <section className="cms-image-picker-section">
                            <div className="cms-image-picker-section-header">
                              <h3>Thumbnail framing</h3>
                              <span className="cms-image-picker-meta-pill">
                                {getThumbnailPositionLabel(thumbnailPositionY)}
                              </span>
                            </div>

                            {item.imageUrl ? (
                              <div className="related-links-editor-frame-section">
                                <div className="related-links-editor-frame-preview">
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="related-links-editor-frame-preview-image"
                                    style={{
                                      objectPosition: `center ${thumbnailPositionY}%`,
                                    }}
                                  />
                                </div>

                                <div className="related-links-editor-frame-controls">
                                  <label
                                    className="related-links-editor-label"
                                    htmlFor={`${item.uid}-thumbnail-position`}
                                  >
                                    Vertical position
                                  </label>
                                  <input
                                    id={`${item.uid}-thumbnail-position`}
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={thumbnailPositionY}
                                    onChange={(event) =>
                                      handleImagePositionChange(
                                        item.uid,
                                        Number(event.target.value),
                                      )
                                    }
                                    disabled={disabled}
                                    className="related-links-editor-frame-slider"
                                  />
                                  <div className="related-links-editor-frame-scale">
                                    <span>Top</span>
                                    <span>{thumbnailPositionY}%</span>
                                    <span>Bottom</span>
                                  </div>
                                  <div className="related-links-editor-frame-presets">
                                    {THUMBNAIL_POSITION_PRESETS.map(
                                      (preset) => (
                                        <button
                                          key={preset.label}
                                          type="button"
                                          onClick={() =>
                                            handleImagePositionChange(
                                              item.uid,
                                              preset.value,
                                            )
                                          }
                                          disabled={disabled}
                                          className={`admin-btn-action${thumbnailPositionY === preset.value ? " is-active" : ""}`}
                                        >
                                          {preset.label}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                  <div className="related-links-editor-helper">
                                    Move the crop upward to keep the top of the
                                    image visible inside the square thumbnail.
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="cms-image-picker-empty">
                                Choose an image first, then adjust how the
                                thumbnail is framed.
                              </p>
                            )}
                          </section>
                        }
                        onChangeAction={(image) =>
                          handleImageChange(item.uid, image)
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
