"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { redirectAndRefresh } from "@/lib/adminNavigation";
import { clientApi } from "@/lib/clientApi";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import {
  buildContentWithRelatedLinks,
  splitContentAndRelatedLinks,
} from "@/lib/relatedLinksContent";
import { slugify } from "@/lib/slugify";
import { toTemplatesRoute } from "@/lib/templatesRoute";
import RelatedLinksEditor from "@/components/RelatedLinksEditor";
import RichContentField from "@/components/RichContentField";
import AdminFormBlock from "@/components/AdminFormBlock";
import AdminModal from "@/components/AdminModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";
import { INLINE_CONTENT_POLICY } from "@/editor/policy";

type ProductEditorProps = {
  product?: ProductItem;
  categories?: ProductCategory[];
};

const EMPTY_PRODUCT: ProductItem = {
  id: "",
  title: "",
  slug: "",
  problem: "",
  description: "",
  bullets: [],
  image: "",
  etsyUrl: "",
  productPageUrl: "",
  price: "",
  categoryId: "",
  status: "draft",
};

export default function ProductEditor({
  product,
  categories = [],
}: ProductEditorProps) {
  const productData = product || EMPTY_PRODUCT;
  const initialContent = splitContentAndRelatedLinks(
    productData.description || "",
  );
  const isCreateMode = !productData.id;
  const previewHref = !isCreateMode
    ? `/preview/templates/${productData.id}`
    : undefined;
  const router = useRouter();
  const [title, setTitle] = useState(productData.title || "");
  const [slug, setSlug] = useState(productData.slug || "");
  const [problem, setProblem] = useState(productData.problem || "");
  const [description, setDescription] = useState(initialContent.contentHtml);
  const [relatedLinks, setRelatedLinks] = useState(initialContent.relatedLinks);
  const [bullets, setBullets] = useState(
    (productData.bullets || []).join("\n") || "",
  );
  const [image, setImage] = useState(productData.image || "");
  const [etsyUrl, setEtsyUrl] = useState(productData.etsyUrl || "");
  const [productPageUrl, setProductPageUrl] = useState(
    toTemplatesRoute(productData.productPageUrl) || "",
  );
  const [price, setPrice] = useState(productData.price || "");
  const [categoryId, setCategoryId] = useState(
    productData.categoryId ||
      (isCreateMode && categories.length > 0 ? categories[0].id : ""),
  );
  const [status, setStatus] = useState<"draft" | "published">(
    productData.status || "draft",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    "problem" | "description" | null
  >(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useUnsavedChangesWarning(isDirty && !saving && !deleting);

  const markDirty = () => setIsDirty(true);

  const handleTitleChange = (value: string) => {
    markDirty();
    setTitle(value);

    if (isCreateMode && !slug.trim()) {
      const autoSlug = slugify(value);
      setSlug(autoSlug);
    }
  };

  async function saveProduct() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // Parse bullets from newline-separated text
      const bulletsArray = bullets
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b);

      const payload = {
        title,
        slug,
        problem,
        description: buildContentWithRelatedLinks(description, relatedLinks),
        bullets: bulletsArray,
        image,
        etsyUrl,
        productPageUrl: toTemplatesRoute(productPageUrl),
        price,
        categoryId,
        status,
      };

      if (isCreateMode) {
        await clientApi.createProduct(payload);
      } else {
        await clientApi.updateProduct(productData.id, payload);
      }

      setIsDirty(false);
      redirectAndRefresh(router, "/cms/templates");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  }

  const handlePreview = () => {
    if (!previewHref) return;
    window.open(previewHref, "_blank", "noopener,noreferrer");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveProduct();
  }

  async function handleDelete() {
    if (isCreateMode) {
      return;
    }

    setConfirmDeleteOpen(false);
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteProduct(productData.id);
      setIsDirty(false);
      redirectAndRefresh(router, "/cms/templates");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic product info */}
      <AdminFormBlock
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 0 1-8 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Template Details"
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Title *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Slug *</label>
            <input
              className="form-control"
              value={slug}
              onChange={(e) => {
                markDirty();
                setSlug(e.target.value);
              }}
              required
            />
          </div>

          {categories.length > 0 && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">Category *</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => {
                  markDirty();
                  setCategoryId(e.target.value);
                }}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-md-3">
            <label className="form-label fw-semibold">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => {
                markDirty();
                setStatus(e.target.value as "draft" | "published");
              }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Price</label>
            <input
              className="form-control"
              value={price}
              onChange={(e) => {
                markDirty();
                setPrice(e.target.value);
              }}
              placeholder="$9.99"
            />
          </div>
        </div>
      </AdminFormBlock>

      {/* Content & media */}
      <AdminFormBlock
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Content &amp; Media"
      >
        <div className="row g-3">
          <div className="col-12">
            <RichContentField
              label="Problem Statement"
              value={problem}
              onChange={(html) => {
                markDirty();
                setProblem(html);
              }}
              storageKey="product-problem-editor-mode"
              htmlRows={3}
              minHeight={150}
              placeholder="Describe the problem this template solves…"
              onSave={saveProduct}
              onPreview={previewHref ? handlePreview : undefined}
              policy={INLINE_CONTENT_POLICY}
              onPopOut={() => setActiveModal("problem")}
            />
          </div>

          <div className="col-12">
            <RichContentField
              label="Description"
              value={description}
              onChange={(html) => {
                markDirty();
                setDescription(html);
              }}
              storageKey="product-description-editor-mode"
              htmlRows={4}
              minHeight={200}
              placeholder="Describe the template in detail…"
              onSave={saveProduct}
              onPreview={previewHref ? handlePreview : undefined}
              policy={INLINE_CONTENT_POLICY}
              hint="Use the Related Links section below to manage the block that renders beneath the main template image."
              onPopOut={() => setActiveModal("description")}
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">
              Bullets{" "}
              <span style={{ fontWeight: 400, color: "var(--sb-muted)" }}>
                (one per line)
              </span>
            </label>
            <textarea
              className="form-control"
              value={bullets}
              onChange={(e) => {
                markDirty();
                setBullets(e.target.value);
              }}
              rows={5}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Image URL</label>
            <input
              className="form-control"
              value={image}
              onChange={(e) => {
                markDirty();
                setImage(e.target.value);
              }}
              placeholder="/images/..."
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Etsy URL</label>
            <input
              className="form-control"
              value={etsyUrl}
              onChange={(e) => {
                markDirty();
                setEtsyUrl(e.target.value);
              }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Template Page URL</label>
            <input
              className="form-control"
              value={productPageUrl}
              onChange={(e) => {
                markDirty();
                setProductPageUrl(e.target.value);
              }}
            />
          </div>
        </div>
      </AdminFormBlock>

      <AdminFormBlock
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Related Links"
      >
        <div className="related-links-section-intro">
          Build the links that appear beneath the template image. They stay out
          of the description editor, use optional thumbnails, and always open in
          the same window.
        </div>
        <RelatedLinksEditor
          value={relatedLinks}
          onChange={(value) => {
            markDirty();
            setRelatedLinks(value);
          }}
          previewVariant="template"
          previewHint="This block is shown beneath the main template image on the public template page."
        />
      </AdminFormBlock>

      {/* Status messages */}
      <EditorFeedback message={message} error={error} />

      {/* Actions */}
      <EditorActions
        saving={saving}
        isCreateMode={isCreateMode}
        entityName="Template"
        onCancel={() => router.back()}
        onDelete={isCreateMode ? undefined : () => setConfirmDeleteOpen(true)}
        deleting={deleting}
        previewHref={previewHref}
      />

      {/* Content field pop-out modals */}
      <AdminModal
        isOpen={activeModal !== null}
        onCloseAction={() => setActiveModal(null)}
        title={activeModal === "problem" ? "Problem Statement" : "Description"}
        size="xl"
      >
        {activeModal === "problem" && (
          <RichContentField
            label=""
            value={problem}
            onChange={(html) => {
              markDirty();
              setProblem(html);
            }}
            storageKey="product-problem-editor-mode"
            htmlRows={3}
            minHeight={500}
            placeholder="Describe the problem this template solves\u2026"
            onSave={saveProduct}
            onPreview={previewHref ? handlePreview : undefined}
            policy={INLINE_CONTENT_POLICY}
            stickyToolbar
          />
        )}
        {activeModal === "description" && (
          <RichContentField
            label=""
            value={description}
            onChange={(html) => {
              markDirty();
              setDescription(html);
            }}
            storageKey="product-description-editor-mode"
            htmlRows={4}
            minHeight={500}
            placeholder="Describe the template in detail\u2026"
            onSave={saveProduct}
            onPreview={previewHref ? handlePreview : undefined}
            policy={INLINE_CONTENT_POLICY}
            stickyToolbar
          />
        )}
      </AdminModal>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmLabel="Delete template"
        destructive
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </form>
  );
}
