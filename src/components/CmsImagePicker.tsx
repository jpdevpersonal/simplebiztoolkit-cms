"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AdminModal from "@/components/AdminModal";
import EditorFeedback from "@/components/EditorFeedback";
import { imageApi, validateImageFile, type ImageAsset } from "@/lib/imageApi";

type CmsImagePickerProps = {
  value?: string | null;
  selectedImageId?: string | null;
  onChangeAction?: (image: ImageAsset | null) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

function formatTimestamp(value?: string): string {
  if (!value) return "";

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "";

  return new Date(parsed).toLocaleDateString();
}

function syncImageByUrl(images: ImageAsset[], url: string | null | undefined) {
  if (!url) {
    return null;
  }

  return images.find((image) => image.url === url) ?? null;
}

export default function CmsImagePicker({
  value,
  selectedImageId,
  onChangeAction,
  label = "Image",
  className,
  disabled = false,
}: CmsImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [savingUpload, setSavingUpload] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAltText, setUploadAltText] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [hoveredImage, setHoveredImage] = useState<ImageAsset | null>(null);
  const [zoomPosition, setZoomPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewUrl = selectedImage?.url ?? value ?? "";
  const linkedToLibrary = Boolean(selectedImage?.id);

  const isEditDirty = useMemo(() => {
    if (!selectedImage) return false;
    return (
      editAltText !== (selectedImage.altText ?? "") ||
      editCaption !== (selectedImage.caption ?? "") ||
      replacementFile !== null
    );
  }, [selectedImage, editAltText, editCaption, replacementFile]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!value && !selectedImageId) {
      setSelectedImage(null);
      setEditAltText("");
      setEditCaption("");
      return;
    }

    setSelectedImage((current) => {
      if (selectedImageId && current?.id === selectedImageId) {
        return current;
      }

      if (!selectedImageId && current?.url === value) {
        return current;
      }

      if (selectedImageId) {
        const matchedById = images.find(
          (image) => image.id === selectedImageId,
        );
        if (matchedById) {
          return matchedById;
        }
      }

      return syncImageByUrl(images, value) ?? null;
    });
  }, [images, selectedImageId, value]);

  useEffect(() => {
    if (!selectedImage) {
      setEditAltText("");
      setEditCaption("");
      return;
    }

    setEditAltText(selectedImage.altText ?? "");
    setEditCaption(selectedImage.caption ?? "");
  }, [selectedImage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadImages() {
      setLibraryLoading(true);
      setError(null);

      try {
        const nextImages = await imageApi.getImages();
        if (cancelled) {
          return;
        }

        setImages(nextImages);
        const match = selectedImageId
          ? (nextImages.find((image) => image.id === selectedImageId) ??
            syncImageByUrl(nextImages, value))
          : syncImageByUrl(nextImages, value);
        if (match) {
          setSelectedImage(match);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load images.",
          );
        }
      } finally {
        if (!cancelled) {
          setLibraryLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedImageId, value]);

  const libraryItems = useMemo(
    () =>
      images.slice().sort((left, right) => {
        return Date.parse(right.updatedUtc) - Date.parse(left.updatedUtc);
      }),
    [images],
  );

  function updateSelection(image: ImageAsset | null) {
    setSelectedImage(image);
    onChangeAction?.(image);
  }

  async function handleUpload() {
    if (!uploadFile) {
      setError("Choose an image file before uploading.");
      return;
    }

    const validationMessage = validateImageFile(uploadFile);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSavingUpload(true);
    setError(null);
    setMessage(null);

    try {
      const createdImage = await imageApi.createImage({
        file: uploadFile,
        altText: uploadAltText,
        caption: uploadCaption,
      });

      setImages((current) => [
        createdImage,
        ...current.filter((item) => item.id !== createdImage.id),
      ]);
      updateSelection(createdImage);
      setUploadFile(null);
      setUploadAltText("");
      setUploadCaption("");
      setMessage("Image uploaded successfully.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload image.",
      );
    } finally {
      setSavingUpload(false);
    }
  }

  async function handleSaveMetadata() {
    if (!selectedImage) {
      setError("Select an image before saving changes.");
      return;
    }

    if (replacementFile) {
      const validationMessage = validateImageFile(replacementFile);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    setSavingMetadata(true);
    setError(null);
    setMessage(null);

    try {
      const updatedImage = await imageApi.updateImage(selectedImage.id, {
        file: replacementFile ?? undefined,
        altText: editAltText,
        caption: editCaption,
      });

      setImages((current) =>
        current.map((image) =>
          image.id === updatedImage.id ? updatedImage : image,
        ),
      );
      updateSelection(updatedImage);
      setReplacementFile(null);
      setMessage("Image details saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save image details.",
      );
    } finally {
      setSavingMetadata(false);
    }
  }

  async function handleDelete() {
    if (!selectedImage) {
      return;
    }

    if (!confirm(`Delete ${selectedImage.blobName}?`)) {
      return;
    }

    setDeletingImage(true);
    setError(null);
    setMessage(null);

    try {
      await imageApi.deleteImage(selectedImage.id);
      setImages((current) =>
        current.filter((image) => image.id !== selectedImage.id),
      );
      updateSelection(null);
      setReplacementFile(null);
      setMessage("Image deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete image.",
      );
    } finally {
      setDeletingImage(false);
    }
  }

  function handleChooseExisting(image: ImageAsset) {
    setError(null);
    setMessage("Image selected.");
    updateSelection(image);
  }

  function handleClearSelection() {
    setError(null);
    setMessage(null);
    updateSelection(null);
    setReplacementFile(null);
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.type === "file") {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  function handleThumbnailMouseEnter(
    image: ImageAsset,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    const target = event.currentTarget;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const previewSize = 288; // 18rem
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = rect.top;
      let left = rect.right + 12;

      if (left + previewSize > viewportWidth) {
        left = rect.left - previewSize - 12;
      }
      if (top + previewSize > viewportHeight) {
        top = viewportHeight - previewSize - 12;
      }
      if (top < 12) top = 12;

      setHoveredImage(image);
      setZoomPosition({ top, left });
    }, 200);
  }

  function handleThumbnailMouseLeave() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredImage(null);
    setZoomPosition(null);
  }

  return (
    <div className={className}>
      <div className="cms-image-picker-trigger-row">
        <div className="cms-image-picker-thumb" aria-hidden="true">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- Admin picker previews may point at arbitrary external URLs that are not compatible with next/image optimization. */}
              <img
                src={previewUrl}
                alt=""
                className="cms-image-picker-thumb-image"
                decoding="async"
              />
            </>
          ) : (
            <span className="cms-image-picker-thumb-empty">No image</span>
          )}
        </div>

        <div className="cms-image-picker-trigger-info">
          <span className="cms-image-picker-trigger-title">
            {selectedImage?.blobName ?? (previewUrl ? "External URL" : "None")}
          </span>
          {selectedImage?.altText ? (
            <span className="cms-image-picker-trigger-subtitle">
              {selectedImage.altText}
            </span>
          ) : null}
        </div>

        <div className="cms-image-picker-actions">
          <button
            type="button"
            className="admin-btn-action"
            onClick={() => setIsOpen(true)}
            disabled={disabled}
          >
            {`Edit ${label}`}
          </button>
          <button
            type="button"
            className="admin-btn-action"
            onClick={handleClearSelection}
            disabled={disabled || !previewUrl}
          >
            Clear
          </button>
        </div>
      </div>

      <AdminModal
        isOpen={isOpen}
        onCloseAction={handleClose}
        title={`Edit ${label}`}
        size="lg"
      >
        <div onKeyDownCapture={handlePanelKeyDown}>
          <EditorFeedback message={message} error={error} />

          <section className="cms-image-picker-section">
            <div className="cms-image-picker-section-header">
              <h3>Current image</h3>
              {linkedToLibrary && selectedImage ? (
                <span className="cms-image-picker-meta-pill">
                  Updated {formatTimestamp(selectedImage.updatedUtc)}
                </span>
              ) : previewUrl ? (
                <span className="cms-image-picker-meta-pill">URL only</span>
              ) : null}
            </div>

            {previewUrl ? (
              <div className="cms-image-picker-preview-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- The selected preview can be a manual external URL, so this remains a plain img with async decoding. */}
                <img
                  src={previewUrl}
                  alt={selectedImage?.altText ?? ""}
                  className="cms-image-picker-preview-image"
                  decoding="async"
                />
                <div className="cms-image-picker-preview-copy">
                  <div className="cms-image-picker-preview-title">
                    {selectedImage?.blobName ?? "External or manual URL"}
                  </div>
                  <div className="cms-image-picker-preview-url">
                    {previewUrl}
                  </div>
                </div>
              </div>
            ) : (
              <p className="cms-image-picker-empty">No image selected yet.</p>
            )}
          </section>

          <section className="cms-image-picker-section">
            <div className="cms-image-picker-section-header">
              <h3>Image library</h3>
              {libraryLoading ? (
                <span className="cms-image-picker-meta-pill">Loading…</span>
              ) : (
                <span className="cms-image-picker-meta-pill">
                  {libraryItems.length} image
                  {libraryItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {libraryItems.length > 0 ? (
              <div className="cms-image-picker-library" role="list">
                {libraryItems.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`cms-image-picker-library-item${selectedImage?.id === image.id ? " is-selected" : ""}`}
                    onClick={() => handleChooseExisting(image)}
                    onMouseEnter={(e) => handleThumbnailMouseEnter(image, e)}
                    onMouseLeave={handleThumbnailMouseLeave}
                    disabled={disabled}
                    title={image.blobName}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Library thumbnails are rendered from mixed remote sources; keep plain img and lazy-load the grid. */}
                    <img
                      src={image.url}
                      alt={image.altText ?? ""}
                      className="cms-image-picker-library-thumb"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="cms-image-picker-library-name">
                      {image.blobName}
                    </span>
                  </button>
                ))}
              </div>
            ) : libraryLoading ? null : (
              <p className="cms-image-picker-empty">No images found yet.</p>
            )}

            {hoveredImage && zoomPosition ? (
              <div
                className="cms-image-picker-zoom-preview"
                style={{ top: zoomPosition.top, left: zoomPosition.left }}
                data-testid="zoom-preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Hover zoom previews use arbitrary library URLs and should not invoke Next image optimization in the editor modal. */}
                <img
                  src={hoveredImage.url}
                  alt={hoveredImage.altText ?? ""}
                  loading="lazy"
                  decoding="async"
                />
                <div className="cms-image-picker-zoom-info">
                  {hoveredImage.blobName}
                </div>
              </div>
            ) : null}
          </section>

          <section className="cms-image-picker-section">
            <div className="cms-image-picker-section-header">
              <h3>Upload new image</h3>
            </div>

            <div className="cms-image-picker-form">
              <div>
                <label
                  className="form-label fw-semibold cms-image-picker-label"
                  htmlFor={`${label}-upload-file`}
                >
                  File
                </label>
                <input
                  id={`${label}-upload-file`}
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled || savingUpload}
                  onChange={(event) =>
                    setUploadFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div>
                <label
                  className="form-label fw-semibold cms-image-picker-label"
                  htmlFor={`${label}-upload-alt`}
                >
                  Alt text
                </label>
                <input
                  id={`${label}-upload-alt`}
                  className="form-control"
                  value={uploadAltText}
                  onChange={(event) => setUploadAltText(event.target.value)}
                  disabled={disabled || savingUpload}
                />
              </div>
              <div>
                <label
                  className="form-label fw-semibold cms-image-picker-label"
                  htmlFor={`${label}-upload-caption`}
                >
                  Caption
                </label>
                <input
                  id={`${label}-upload-caption`}
                  className="form-control"
                  value={uploadCaption}
                  onChange={(event) => setUploadCaption(event.target.value)}
                  disabled={disabled || savingUpload}
                />
              </div>
              <button
                type="button"
                className="admin-btn-save cms-image-picker-submit"
                disabled={disabled || savingUpload}
                onClick={() => void handleUpload()}
              >
                {savingUpload ? "Uploading…" : "Upload image"}
              </button>
            </div>
          </section>

          <section className="cms-image-picker-section">
            <div className="cms-image-picker-section-header">
              <h3>Edit selected image</h3>
            </div>

            {selectedImage ? (
              <div className="cms-image-picker-form">
                <div>
                  <label
                    className="form-label fw-semibold cms-image-picker-label"
                    htmlFor={`${label}-edit-alt`}
                  >
                    Alt text
                  </label>
                  <input
                    id={`${label}-edit-alt`}
                    className="form-control"
                    value={editAltText}
                    onChange={(event) => setEditAltText(event.target.value)}
                    disabled={disabled || savingMetadata}
                  />
                </div>
                <div>
                  <label
                    className="form-label fw-semibold cms-image-picker-label"
                    htmlFor={`${label}-edit-caption`}
                  >
                    Caption
                  </label>
                  <input
                    id={`${label}-edit-caption`}
                    className="form-control"
                    value={editCaption}
                    onChange={(event) => setEditCaption(event.target.value)}
                    disabled={disabled || savingMetadata}
                  />
                </div>
                <div>
                  <label
                    className="form-label fw-semibold cms-image-picker-label"
                    htmlFor={`${label}-replace-file`}
                  >
                    Replace file
                  </label>
                  <input
                    id={`${label}-replace-file`}
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled || savingMetadata}
                    onChange={(event) =>
                      setReplacementFile(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <div className="cms-image-picker-button-row">
                  <button
                    type="button"
                    className="admin-btn-save cms-image-picker-submit"
                    disabled={disabled || savingMetadata || !isEditDirty}
                    onClick={() => void handleSaveMetadata()}
                  >
                    {savingMetadata ? "Saving…" : "Save image details"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger cms-image-picker-delete"
                    onClick={handleDelete}
                    disabled={disabled || deletingImage}
                  >
                    {deletingImage ? "Deleting…" : "Delete image"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="cms-image-picker-empty">
                Select an image from the library to edit it.
              </p>
            )}
          </section>
        </div>
      </AdminModal>
    </div>
  );
}
