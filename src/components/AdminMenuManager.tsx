"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItem, MenuLayoutSettings } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import { revalidateMenuContent } from "@/lib/adminRevalidation";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorFeedback from "@/components/EditorFeedback";
import {
  hiddenStaticOrderIdToStaticOrderId,
  isStaticNavOrderId,
  staticNavItems,
  toHiddenStaticNavOrderId,
  toStaticNavOrderId,
} from "@/config/staticNavItems";
import {
  normalizeOrderedMenuItemIds,
  orderEntitiesByIds,
} from "@/lib/menuLayout";

type Props = {
  menuItems: MenuItem[];
  initialLayout?: MenuLayoutSettings | null;
};

type ManagedStaticNavItem = {
  id: string;
  kind: "static";
  label: string;
  href: string;
};

type ManagedCmsNavItem = {
  id: string;
  kind: "cms";
  item: MenuItem;
};

type ManagedNavItem = ManagedStaticNavItem | ManagedCmsNavItem;

type SortableRowProps = {
  item: ManagedNavItem;
  disabled: boolean;
  busy: boolean;
  onToggleStatus: (item: ManagedCmsNavItem) => Promise<void>;
  onDelete: (item: ManagedCmsNavItem) => Promise<void>;
  onHideBuiltIn: (item: ManagedStaticNavItem) => void;
};

function StatusBadge({ status }: { status?: string }) {
  const published = status === "published";
  return (
    <span
      className={`admin-badge ${published ? "admin-badge-published" : "admin-badge-draft"}`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function SortableMenuRow({
  item,
  disabled,
  busy,
  onToggleStatus,
  onDelete,
  onHideBuiltIn,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      className={`admin-menu-manager-row${isDragging ? " is-dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className="admin-menu-manager-drag"
        aria-label={`Reorder ${item.kind === "cms" ? item.item.title : item.label}`}
        {...attributes}
        {...listeners}
        disabled={disabled}
      >
        <span aria-hidden>⋮⋮</span>
      </button>

      <div className="admin-menu-manager-row-main">
        <div className="admin-menu-manager-row-title">
          {item.kind === "cms" ? item.item.title : item.label}
        </div>
        <div className="admin-menu-manager-row-meta">
          {item.kind === "cms" ? (
            <StatusBadge status={item.item.status} />
          ) : (
            <span className="admin-menu-manager-static-pill">
              Static link: {item.href}
            </span>
          )}
        </div>
      </div>

      <div className="admin-menu-manager-row-actions">
        {item.kind === "cms" ? (
          <>
            <Link
              href={`/admin/menu/${item.item.id}/edit`}
              className="admin-btn-action"
            >
              Edit
            </Link>
            <button
              type="button"
              className="admin-btn-action"
              onClick={() => onToggleStatus(item)}
              disabled={disabled}
            >
              {item.item.status === "published" ? "Hide" : "Publish"}
            </button>
            <button
              type="button"
              className="admin-btn-danger admin-menu-manager-delete"
              onClick={() => onDelete(item)}
              disabled={disabled}
            >
              {busy ? "Deleting..." : "Delete"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="admin-btn-warning admin-menu-manager-delete"
            onClick={() => onHideBuiltIn(item)}
            disabled={disabled}
          >
            Hide
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminMenuManager({ menuItems, initialLayout }: Props) {
  const newTitleInputId = "menu-manager-new-title";
  const newStatusInputId = "menu-manager-new-status";

  const allStaticItems = useMemo<ManagedStaticNavItem[]>(
    () =>
      staticNavItems.map((item) => ({
        id: toStaticNavOrderId(item.to),
        kind: "static",
        label: item.label,
        href: item.to,
      })),
    [],
  );

  const initialLayoutOrderIds = useMemo(
    () => normalizeOrderedMenuItemIds(initialLayout?.orderedMenuItemIds),
    [initialLayout?.orderedMenuItemIds],
  );

  const initialHiddenStaticNavIds = useMemo(() => {
    const availableStaticIds = new Set(allStaticItems.map((item) => item.id));
    const hiddenIds = new Set<string>();

    for (const rawId of initialLayoutOrderIds) {
      const staticId = hiddenStaticOrderIdToStaticOrderId(rawId);
      if (!staticId || !availableStaticIds.has(staticId)) continue;
      hiddenIds.add(staticId);
    }

    return allStaticItems
      .map((item) => item.id)
      .filter((id) => hiddenIds.has(id));
  }, [allStaticItems, initialLayoutOrderIds]);

  const initialOrder = useMemo<ManagedNavItem[]>(() => {
    const positionalOrderIds = initialLayoutOrderIds.filter(
      (id) => hiddenStaticOrderIdToStaticOrderId(id) === null,
    );
    const visibleStaticItems = allStaticItems.filter(
      (item) => !initialHiddenStaticNavIds.includes(item.id),
    );
    const cmsItems = orderEntitiesByIds(menuItems, positionalOrderIds).map(
      (item) => ({
        id: item.id,
        kind: "cms" as const,
        item,
      }),
    );

    const includesManagedStaticTokens = initialLayoutOrderIds.some(
      (id) =>
        isStaticNavOrderId(id) ||
        hiddenStaticOrderIdToStaticOrderId(id) !== null,
    );
    if (!includesManagedStaticTokens) {
      return [...visibleStaticItems, ...cmsItems];
    }

    return orderEntitiesByIds(
      [...visibleStaticItems, ...cmsItems],
      positionalOrderIds,
    );
  }, [
    allStaticItems,
    initialHiddenStaticNavIds,
    initialLayoutOrderIds,
    menuItems,
  ]);

  const [items, setItems] = useState<ManagedNavItem[]>(initialOrder);
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>(
    initialOrder.map((item) => item.id),
  );
  const [hiddenStaticNavIds, setHiddenStaticNavIds] = useState<string[]>(
    initialHiddenStaticNavIds,
  );
  const [savedHiddenStaticNavIds, setSavedHiddenStaticNavIds] = useState<
    string[]
  >(initialHiddenStaticNavIds);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<"draft" | "published">("draft");
  const [adding, setAdding] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderSignature = items.map((item) => item.id).join("|");
  const savedSignature = savedOrderIds.join("|");
  const hiddenStaticIdSet = useMemo(
    () => new Set(hiddenStaticNavIds),
    [hiddenStaticNavIds],
  );
  const normalizedHiddenStaticNavIds = useMemo(
    () =>
      allStaticItems
        .map((item) => item.id)
        .filter((id) => hiddenStaticIdSet.has(id)),
    [allStaticItems, hiddenStaticIdSet],
  );
  const savedHiddenStaticIdSet = useMemo(
    () => new Set(savedHiddenStaticNavIds),
    [savedHiddenStaticNavIds],
  );
  const normalizedSavedHiddenStaticNavIds = useMemo(
    () =>
      allStaticItems
        .map((item) => item.id)
        .filter((id) => savedHiddenStaticIdSet.has(id)),
    [allStaticItems, savedHiddenStaticIdSet],
  );
  const hiddenSignature = normalizedHiddenStaticNavIds.join("|");
  const savedHiddenSignature = normalizedSavedHiddenStaticNavIds.join("|");
  const hasUnsavedChanges =
    orderSignature !== savedSignature ||
    hiddenSignature !== savedHiddenSignature;
  const cmsItemCount = items.filter((item) => item.kind === "cms").length;
  const visibleStaticItemCount = items.length - cmsItemCount;
  const hiddenStaticItems = useMemo(
    () =>
      allStaticItems.filter((item) =>
        normalizedHiddenStaticNavIds.includes(item.id),
      ),
    [allStaticItems, normalizedHiddenStaticNavIds],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === String(active.id));
      const newIndex = prev.findIndex((item) => item.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleAddMenuItem(e: FormEvent) {
    e.preventDefault();

    const title = newTitle.trim();
    if (!title) {
      setError("Please enter a title before adding a menu item.");
      return;
    }

    setAdding(true);
    setMessage(null);
    setError(null);

    try {
      const created = await clientApi.createMenuItem({
        title,
        status: newStatus,
      });
      const createdItem = {
        ...created,
        status: created.status ?? newStatus,
      } as MenuItem;

      const createdManagedItem: ManagedCmsNavItem = {
        id: createdItem.id,
        kind: "cms",
        item: createdItem,
      };

      setItems((prev) => [...prev, createdManagedItem]);
      setNewTitle("");
      setNewStatus("draft");
      setMessage(`Added menu item \"${createdItem.title}\".`);
      await revalidateMenuContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleStatus(item: ManagedCmsNavItem) {
    const nextStatus = item.item.status === "published" ? "draft" : "published";

    setBusyItemId(item.id);
    setMessage(null);
    setError(null);

    try {
      await clientApi.updateMenuItem(item.id, {
        title: item.item.title,
        description: item.item.description,
        status: nextStatus,
      });
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id && candidate.kind === "cms"
            ? { ...candidate, item: { ...candidate.item, status: nextStatus } }
            : candidate,
        ),
      );
      await revalidateMenuContent();
      setMessage(
        `${item.item.title} is now ${nextStatus === "published" ? "published" : "hidden"}.`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleDelete(item: ManagedCmsNavItem) {
    if (
      !confirm(
        `Delete \"${item.item.title}\"? This permanently removes the menu item and any nested topics/pages attached in the backend.`,
      )
    ) {
      return;
    }

    setBusyItemId(item.id);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuItem(item.id);
      setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
      setSavedOrderIds((prev) => prev.filter((id) => id !== item.id));
      await revalidateMenuContent();
      setMessage(`Deleted menu item \"${item.item.title}\".`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusyItemId(null);
    }
  }

  function handleHideBuiltIn(item: ManagedStaticNavItem) {
    if (
      !confirm(
        `Hide built-in menu item \"${item.label}\"? This is a soft delete and can be restored later.`,
      )
    ) {
      return;
    }

    setError(null);
    setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
    setHiddenStaticNavIds((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(item.id);
      return allStaticItems
        .map((candidate) => candidate.id)
        .filter((id) => nextSet.has(id));
    });
    setMessage(
      `Built-in link \"${item.label}\" hidden. Click Save Order to persist.`,
    );
  }

  function handleRestoreBuiltIn(itemId: string) {
    const staticItem = allStaticItems.find((item) => item.id === itemId);
    if (!staticItem) return;

    setError(null);
    setHiddenStaticNavIds((prev) => prev.filter((id) => id !== itemId));
    setItems((prev) => {
      if (prev.some((candidate) => candidate.id === itemId)) {
        return prev;
      }

      const next = [...prev];
      const firstCmsIndex = next.findIndex(
        (candidate) => candidate.kind === "cms",
      );
      const insertAt = firstCmsIndex === -1 ? next.length : firstCmsIndex;
      next.splice(insertAt, 0, staticItem);
      return next;
    });
    setMessage(
      `Built-in link \"${staticItem.label}\" restored. Click Save Order to persist.`,
    );
  }

  async function handleSaveOrder() {
    setSavingOrder(true);
    setMessage(null);
    setError(null);

    try {
      const orderedVisibleIds = items.map((item) => item.id);
      const hiddenStaticOrderTokens = allStaticItems
        .filter((item) => normalizedHiddenStaticNavIds.includes(item.id))
        .map((item) => toHiddenStaticNavOrderId(item.href));
      const orderedMenuItemIds = [
        ...orderedVisibleIds,
        ...hiddenStaticOrderTokens,
      ];

      await clientApi.updateMenuLayoutSettings({
        menuKey: "primary",
        orderedMenuItemIds,
        isActive: true,
      });
      setSavedOrderIds(orderedVisibleIds);
      setSavedHiddenStaticNavIds(normalizedHiddenStaticNavIds);
      await revalidateMenuContent();
      setMessage("Menu order saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingOrder(false);
    }
  }

  const managerIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const addIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div className="admin-page-shell">
      <EditorFeedback message={message} error={error} />

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <AdminFormBlock icon={managerIcon} title="Top-level Menu Order">
            <p className="admin-page-description mb-3">
              Drag to reorder the full header sequence. Static links and CMS
              items are shown together so you can place CMS entries anywhere in
              the existing navigation.
            </p>

            {items.length === 0 ? (
              <div className="admin-empty-state admin-menu-manager-empty">
                No menu items yet. Add your first one from the quick-add panel.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="admin-menu-manager-list">
                    {items.map((item) => {
                      const busy =
                        item.kind === "cms" && busyItemId === item.id;
                      return (
                        <SortableMenuRow
                          key={item.id}
                          item={item}
                          busy={busy}
                          disabled={busy || savingOrder}
                          onToggleStatus={handleToggleStatus}
                          onDelete={handleDelete}
                          onHideBuiltIn={handleHideBuiltIn}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {hiddenStaticItems.length > 0 && (
              <div className="mt-3">
                <p className="admin-page-meta mb-2">
                  Hidden built-ins (soft deleted)
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {hiddenStaticItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="admin-btn-action"
                      onClick={() => handleRestoreBuiltIn(item.id)}
                      disabled={savingOrder}
                    >
                      Restore {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-menu-manager-footer">
              <span className="admin-page-meta">
                {cmsItemCount} CMS items · {visibleStaticItemCount} visible
                static links
                {hiddenStaticItems.length > 0
                  ? ` · ${hiddenStaticItems.length} hidden built-ins`
                  : ""}
                {hasUnsavedChanges ? " · Unsaved changes" : " · Changes saved"}
              </span>
              <button
                type="button"
                className="admin-btn-save"
                onClick={handleSaveOrder}
                disabled={!hasUnsavedChanges || savingOrder}
              >
                {savingOrder ? "Saving..." : "Save Order"}
              </button>
            </div>
          </AdminFormBlock>
        </div>

        <div className="col-12 col-xl-4">
          <form onSubmit={handleAddMenuItem}>
            <AdminFormBlock icon={addIcon} title="Add Menu Item">
              <div className="mb-3">
                <label
                  className="form-label fw-semibold"
                  htmlFor={newTitleInputId}
                >
                  Title *
                </label>
                <input
                  id={newTitleInputId}
                  className="form-control"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Services, Resources"
                  required
                />
              </div>

              <div className="mb-3">
                <label
                  className="form-label fw-semibold"
                  htmlFor={newStatusInputId}
                >
                  Status
                </label>
                <select
                  id={newStatusInputId}
                  className="form-select"
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as "draft" | "published")
                  }
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="admin-menu-manager-add-actions">
                <button
                  type="submit"
                  className="admin-btn-save"
                  disabled={adding}
                >
                  {adding ? "Adding..." : "Add Menu Item"}
                </button>
                <Link href="/admin/menu" className="admin-btn-cancel">
                  Open Full Menu Editor
                </Link>
              </div>
            </AdminFormBlock>
          </form>
        </div>
      </div>
    </div>
  );
}
