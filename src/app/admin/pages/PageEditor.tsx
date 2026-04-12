/**
 * Page Editor – Client Component
 * Full-featured editor for creating/editing menu item pages.
 * Supports menu item + category assignment, rich content, media, and SEO.
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  ImageAsset,
  MenuItem,
  MenuCategory,
  MenuItemPage,
} from "@/lib/api";
import { redirectAndRefresh, refreshEditor } from "@/lib/adminNavigation";
import { clientApi } from "@/lib/clientApi";
import { compactHtmlForStorage } from "@/lib/htmlFormatter";
import RichContentField from "@/components/RichContentField";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";
import CmsImagePicker from "@/components/CmsImagePicker";

type SectionKey =
  | "pageContent"
  | "media"
  | "content"
  | "assignment"
  | "publish"
  | "seo";

const SIDEBAR_SECTION_KEYS: SectionKey[] = ["assignment", "publish"];

type Props = {
  page?: MenuItemPage;
  menuItems: MenuItem[];
  /** Pre-selected menu item id */
  initialMenuItemId?: string;
  /** Pre-selected category id */
  initialCategoryId?: string;
  isNew?: boolean;
};

export default function PageEditor({
  page,
  menuItems,
  initialMenuItemId,
  initialCategoryId,
  isNew = false,
}: Props) {
  const router = useRouter();
  const previewHref =
    !isNew && page?.id ? `/preview/pages/${page.id}` : undefined;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<SectionKey, boolean>
  >({
    pageContent: false,
    media: false,
    content: false,
    assignment: false,
    publish: false,
    seo: false,
  });

  const today = new Date().toISOString().split("T")[0];

  // Resolve initial menu item id
  const resolvedMenuItemId =
    initialMenuItemId ??
    page?.menuItemId ??
    (page?.menuCategoryId
      ? menuItems.find((m) =>
          (m.categories ?? []).some((c) => c.id === page.menuCategoryId),
        )?.id
      : undefined) ??
    "";

  const [selectedMenuItemId, setSelectedMenuItemId] =
    useState(resolvedMenuItemId);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategoryId ?? page?.menuCategoryId ?? "",
  );

  // Dynamically compute available categories for selected menu item
  const [dynamicCategories, setDynamicCategories] = useState<MenuCategory[]>(
    [],
  );
  const [loadingCats, setLoadingCats] = useState(false);

  // Categories from the selected menu item's nested data
  const inlineCats = useMemo(() => {
    if (!selectedMenuItemId) return [];
    const item = menuItems.find((m) => m.id === selectedMenuItemId);
    return item?.categories ?? [];
  }, [selectedMenuItemId, menuItems]);

  // Fetch categories when menu item changes (in case nested data is incomplete)
  useEffect(() => {
    if (!selectedMenuItemId) {
      setDynamicCategories([]);
      return;
    }
    let cancelled = false;
    setLoadingCats(true);
    clientApi
      .getMenuCategories(selectedMenuItemId)
      .then((cats) => {
        if (!cancelled) setDynamicCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setDynamicCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCats(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMenuItemId]);

  // Merge inline + fetched categories (prefer fetched, deduplicate by id)
  const categories = useMemo(() => {
    const map = new Map<string, MenuCategory>();
    for (const c of inlineCats) map.set(c.id, c);
    for (const c of dynamicCategories) map.set(c.id, c);
    return Array.from(map.values());
  }, [inlineCats, dynamicCategories]);

  // Reset category when menu item changes
  useEffect(() => {
    if (selectedMenuItemId !== resolvedMenuItemId) {
      setSelectedCategoryId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenuItemId]);

  const [formData, setFormData] = useState({
    title: page?.title ?? "",
    subtitle: page?.subtitle ?? "",
    slug: page?.slug ?? "",
    description: page?.description ?? "",
    content: page?.content ?? "",
    editorJson: page?.editorJson ?? (null as string | null),
    featuredImageId: page?.featuredImageId ?? "",
    featuredImage: page?.featuredImage ?? "",
    headerImageId: page?.headerImageId ?? "",
    headerImage: page?.headerImage ?? "",
    status: page?.status ?? "draft",
    dateISO: page?.dateISO ?? today,
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
    ogImage: page?.ogImage ?? "",
    canonicalUrl: page?.canonicalUrl ?? "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  function handleImageSelection(
    field: "featured" | "header",
    image: ImageAsset | null,
  ) {
    setFormData((prev) => ({
      ...prev,
      ...(field === "featured"
        ? {
            featuredImageId: image?.id ?? "",
            featuredImage: image?.url ?? "",
          }
        : {
            headerImageId: image?.id ?? "",
            headerImage: image?.url ?? "",
          }),
    }));
  }

  // Auto-generate slug
  useEffect(() => {
    if (isNew && formData.title && !formData.slug) {
      const generated = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      update("slug", generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title, isNew]);

  async function savePage() {
    if (!selectedMenuItemId) {
      setError("Please select a Menu Item.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const normalizedFormData = {
        ...formData,
        content: compactHtmlForStorage(formData.content),
      };
      const featuredImageId = formData.featuredImageId;
      const headerImageId = formData.headerImageId;
      const pageFields = Object.fromEntries(
        Object.entries(normalizedFormData).filter(
          ([key]) =>
            ![
              "featuredImage",
              "headerImage",
              "featuredImageId",
              "headerImageId",
            ].includes(key),
        ),
      ) as Omit<
        typeof formData,
        "featuredImage" | "headerImage" | "featuredImageId" | "headerImageId"
      >;

      const payload: Partial<MenuItemPage> = {
        ...pageFields,
        ...(featuredImageId ? { featuredImageId } : {}),
        ...(headerImageId ? { headerImageId } : {}),
        dateModified: today,
      };

      if (selectedCategoryId) {
        payload.menuCategoryId = selectedCategoryId;
        payload.menuItemId = undefined;
      } else {
        payload.menuItemId = selectedMenuItemId;
        payload.menuCategoryId = undefined;
      }

      if (isNew) {
        await clientApi.createMenuItemPage(payload);
        redirectAndRefresh(router, "/admin/pages");
      } else if (page?.id) {
        await clientApi.updateMenuItemPage(page.id, payload);
        setMessage("Page saved successfully!");
        refreshEditor(router);
      } else {
        throw new Error("Missing page id for update");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await savePage();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this page?")) return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuItemPage(page!.id);
      redirectAndRefresh(router, "/admin/pages");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  const handlePreview = () => {
    if (!previewHref) return;
    window.open(previewHref, "_blank", "noopener,noreferrer");
  };

  const toggleSection = (section: SectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const sidebarCollapsedCount = SIDEBAR_SECTION_KEYS.filter(
    (section) => collapsedSections[section],
  ).length;

  const layoutClassName = [
    "page-editor-layout",
    sidebarCollapsedCount >= 3
      ? "page-editor-layout--sidebar-minimized"
      : sidebarCollapsedCount >= 2
        ? "page-editor-layout--sidebar-compact"
        : sidebarCollapsedCount >= 1
          ? "page-editor-layout--sidebar-relaxed"
          : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderSectionToggle = (section: SectionKey, title: string) => {
    const collapsed = collapsedSections[section];

    return (
      <button
        type="button"
        className="page-editor-section-toggle"
        onClick={() => toggleSection(section)}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
      >
        {collapsed ? "+ Expand" : "- Collapse"}
      </button>
    );
  };

  /* ── Icons ──────────────────────────────────── */
  const contentIcon = (
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
  );

  const settingsIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const seoIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="m21 21-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const mediaIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="21 15 16 10 5 21"
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

      <div className={layoutClassName} data-testid="page-editor-layout">
        {/* Main column */}
        <div className="page-editor-main">
          <AdminFormBlock
            icon={contentIcon}
            title="Page Content"
            className={
              collapsedSections.pageContent
                ? "admin-form-block--collapsed"
                : undefined
            }
            headerActions={renderSectionToggle("pageContent", "Page Content")}
          >
            {!collapsedSections.pageContent && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Title *</label>
                  <input
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => update("title", e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Subtitle</label>
                  <input
                    className="form-control"
                    value={formData.subtitle}
                    onChange={(e) => update("subtitle", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Slug *</label>
                  <input
                    className="form-control"
                    value={formData.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    required
                  />
                  <div className="form-text">
                    URL path segment, e.g. <code>getting-started</code>. The
                    page will be accessible at{" "}
                    <code>/{formData.slug || "..."}</code>
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
          </AdminFormBlock>

          {/* Media */}
          <AdminFormBlock
            icon={mediaIcon}
            title="Media"
            className={
              collapsedSections.media
                ? "admin-form-block--collapsed"
                : undefined
            }
            headerActions={renderSectionToggle("media", "Media")}
          >
            {!collapsedSections.media && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Featured Image
                  </label>
                  <CmsImagePicker
                    value={formData.featuredImage}
                    selectedImageId={formData.featuredImageId}
                    label="featured image"
                    onChangeAction={(image) =>
                      handleImageSelection("featured", image)
                    }
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold">Header Image</label>
                  <CmsImagePicker
                    value={formData.headerImage}
                    selectedImageId={formData.headerImageId}
                    label="header image"
                    onChangeAction={(image) =>
                      handleImageSelection("header", image)
                    }
                  />
                </div>
              </>
            )}
          </AdminFormBlock>

          {/* SEO */}
          <AdminFormBlock
            icon={seoIcon}
            title="SEO"
            className={
              collapsedSections.seo ? "admin-form-block--collapsed" : undefined
            }
            headerActions={renderSectionToggle("seo", "SEO")}
          >
            {!collapsedSections.seo && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">SEO Title</label>
                  <input
                    className="form-control"
                    value={formData.seoTitle}
                    onChange={(e) => update("seoTitle", e.target.value)}
                    placeholder="Leave blank to use page title"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    SEO Description
                  </label>
                  <textarea
                    className="form-control"
                    value={formData.seoDescription}
                    onChange={(e) => update("seoDescription", e.target.value)}
                    rows={3}
                    placeholder="Leave blank to use page description"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">OG Image URL</label>
                  <input
                    className="form-control"
                    value={formData.ogImage}
                    onChange={(e) => update("ogImage", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold">
                    Canonical URL
                  </label>
                  <input
                    className="form-control"
                    value={formData.canonicalUrl}
                    onChange={(e) => update("canonicalUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
          </AdminFormBlock>
        </div>

        {/* Sidebar column */}
        <div className="page-editor-sidebar">
          {/* Assignment */}
          <AdminFormBlock
            icon={settingsIcon}
            title="Assignment"
            className={
              collapsedSections.assignment
                ? "admin-form-block--collapsed"
                : undefined
            }
            headerActions={renderSectionToggle("assignment", "Assignment")}
          >
            {!collapsedSections.assignment && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Menu Item *</label>
                  <select
                    className="form-select"
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                    required
                  >
                    <option value="">— Select a menu item —</option>
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                        {m.status === "published" ? "" : " (draft)"}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Every page must belong to a menu item.
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label fw-semibold">Topic</label>
                  <select
                    className="form-select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={!selectedMenuItemId || loadingCats}
                  >
                    <option value="">— No topic (direct page) —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                        {cat.status === "published" ? "" : " (draft)"}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Optional. Assign to a topic to group related pages.
                  </div>
                </div>
              </>
            )}
          </AdminFormBlock>

          {/* Publish */}
          <AdminFormBlock
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="Publish"
            className={
              collapsedSections.publish
                ? "admin-form-block--collapsed"
                : undefined
            }
            headerActions={renderSectionToggle("publish", "Publish")}
          >
            {!collapsedSections.publish && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="form-label fw-semibold">Publish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dateISO}
                    onChange={(e) => update("dateISO", e.target.value)}
                  />
                </div>
              </>
            )}
          </AdminFormBlock>
        </div>

        <div
          className="page-editor-content-row"
          data-testid="page-editor-content-row"
        >
          <AdminFormBlock
            icon={contentIcon}
            title="Content"
            className={
              collapsedSections.content
                ? "admin-form-block--collapsed"
                : undefined
            }
            headerActions={renderSectionToggle("content", "Content")}
          >
            {!collapsedSections.content && (
              <div>
                <RichContentField
                  label=""
                  value={formData.content}
                  onChange={(html) => update("content", html)}
                  storageKey="page-content-mode"
                  placeholder="Start writing your page content here…"
                  minHeight={420}
                  onSave={savePage}
                  onPreview={previewHref ? handlePreview : undefined}
                  enableHtmlFormatting
                  formatHtmlOnModeSwitch
                  htmlEditorVariant="code"
                />
                <div className="form-text mt-1">
                  Use the toggle above to switch between HTML and the rich-text
                  editor.
                </div>
              </div>
            )}
          </AdminFormBlock>
        </div>
      </div>

      <EditorActions
        saving={saving}
        isCreateMode={isNew}
        entityName="Page"
        onCancel={() => router.push("/admin/pages")}
        onDelete={!isNew && page ? handleDelete : undefined}
        deleting={deleting}
        previewHref={previewHref}
        previewLabel="Preview"
      />
    </form>
  );
}
