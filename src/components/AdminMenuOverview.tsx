"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { MenuCategory, MenuItem, MenuItemPage } from "@/lib/api";
import AdminTableToolbar from "@/components/AdminTableToolbar";
import StatusBadge from "@/components/StatusBadge";

export type AdminMenuCategoryRow = MenuCategory & {
  menuItemTitle: string;
  pageCount: number;
};

export type AdminMenuPageRow = MenuItemPage & {
  menuItemTitle: string;
  categoryTitle: string | null;
};

type Props = {
  menuItems: MenuItem[];
  categories: AdminMenuCategoryRow[];
  pages: AdminMenuPageRow[];
};

type TabKey = "items" | "topics" | "pages";

const tabs: { key: TabKey; label: string }[] = [
  { key: "items", label: "Menu items" },
  { key: "topics", label: "Topics" },
  { key: "pages", label: "Menu pages" },
];

export default function AdminMenuOverview({
  menuItems,
  categories,
  pages,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("items");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const ownerOptions = useMemo(
    () =>
      [...menuItems]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((item) => ({ label: item.title, value: item.title })),
    [menuItems],
  );

  const visibleItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (!normalizedQuery ||
            `${item.title} ${item.description ?? ""}`
              .toLowerCase()
              .includes(normalizedQuery)) &&
          (!statusFilter || item.status === statusFilter),
      ),
    [menuItems, normalizedQuery, statusFilter],
  );

  const visibleTopics = useMemo(
    () =>
      categories.filter(
        (category) =>
          (!normalizedQuery ||
            `${category.title} ${category.menuItemTitle}`
              .toLowerCase()
              .includes(normalizedQuery)) &&
          (!statusFilter || category.status === statusFilter) &&
          (!ownerFilter || category.menuItemTitle === ownerFilter),
      ),
    [categories, normalizedQuery, ownerFilter, statusFilter],
  );

  const visiblePages = useMemo(
    () =>
      pages.filter(
        (page) =>
          (!normalizedQuery ||
            [
              page.title,
              page.slug,
              page.menuItemTitle,
              page.categoryTitle ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)) &&
          (!statusFilter || page.status === statusFilter) &&
          (!ownerFilter || page.menuItemTitle === ownerFilter),
      ),
    [normalizedQuery, ownerFilter, pages, statusFilter],
  );

  const counts: Record<TabKey, number> = {
    items: menuItems.length,
    topics: categories.length,
    pages: pages.length,
  };
  const visibleCounts: Record<TabKey, number> = {
    items: visibleItems.length,
    topics: visibleTopics.length,
    pages: visiblePages.length,
  };

  const selectTab = (tab: TabKey) => {
    setActiveTab(tab);
    setQuery("");
    setStatusFilter("");
    setOwnerFilter("");
  };

  const filters = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ],
    },
    ...(activeTab === "items"
      ? []
      : [
          {
            key: "owner",
            label: "Menu item",
            value: ownerFilter,
            options: ownerOptions,
          },
        ]),
  ];

  const createHref =
    activeTab === "items"
      ? "/cms/menu/new"
      : activeTab === "topics"
        ? menuItems[0]
          ? `/cms/menu/${menuItems[0].id}/categories/new`
          : null
        : "/cms/pages/new";
  const createLabel =
    activeTab === "items"
      ? "New Menu Item"
      : activeTab === "topics"
        ? "New Topic"
        : "New Page";

  return (
    <section className="admin-section-card admin-menu-overview">
      <div className="admin-menu-overview-header">
        <div
          className="admin-segmented-control"
          role="tablist"
          aria-label="Navigation content"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-label={`${tab.label} ${counts[tab.key]}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`admin-menu-panel-${tab.key}`}
              onClick={() => selectTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="admin-segmented-count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        {createHref ? (
          <Link href={createHref} className="admin-btn-save">
            <Plus size={15} aria-hidden="true" />
            {createLabel}
          </Link>
        ) : null}
      </div>

      <AdminTableToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel={`Search ${tabs.find((tab) => tab.key === activeTab)?.label}`}
        placeholder={
          activeTab === "items"
            ? "Search menu items"
            : activeTab === "topics"
              ? "Search topics or menu items"
              : "Search pages, slugs, or structure"
        }
        filters={filters}
        onFilterChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
          if (key === "owner") setOwnerFilter(value);
        }}
        visibleCount={visibleCounts[activeTab]}
        totalCount={counts[activeTab]}
        onClear={() => {
          setQuery("");
          setStatusFilter("");
          setOwnerFilter("");
        }}
      />

      {activeTab === "items" ? (
        <div
          id="admin-menu-panel-items"
          role="tabpanel"
          className="admin-table-wrap"
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Topics</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-state">
                    {menuItems.length === 0
                      ? "No menu items found. Create your first menu item!"
                      : "No menu items match the current search and filters."}
                  </td>
                </tr>
              ) : null}
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {item.title}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="admin-cell-muted" data-label="Topics">
                    {
                      categories.filter(
                        (category) => category.menuItemId === item.id,
                      ).length
                    }
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/menu/${item.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === "topics" ? (
        <div
          id="admin-menu-panel-topics"
          role="tabpanel"
          className="admin-table-wrap"
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Menu Item</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTopics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-state">
                    {categories.length === 0
                      ? "No topics found."
                      : "No topics match the current search and filters."}
                  </td>
                </tr>
              ) : null}
              {visibleTopics.map((category) => (
                <tr key={category.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {category.title}
                  </td>
                  <td className="admin-cell-muted" data-label="Menu Item">
                    {category.menuItemTitle}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={category.status} />
                  </td>
                  <td className="admin-cell-muted" data-label="Pages">
                    {category.pageCount}
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/menu/categories/${category.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === "pages" ? (
        <div
          id="admin-menu-panel-pages"
          role="tabpanel"
          className="admin-table-wrap"
        >
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Menu Item</th>
                <th className="admin-col-phone-hide">Topic</th>
                <th className="admin-col-tablet-hide admin-col-phone-hide">
                  Slug
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    {pages.length === 0
                      ? "No pages found."
                      : "No pages match the current search and filters."}
                  </td>
                </tr>
              ) : null}
              {visiblePages.map((page) => (
                <tr key={page.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {page.title}
                  </td>
                  <td className="admin-cell-muted" data-label="Menu Item">
                    {page.menuItemTitle}
                  </td>
                  <td
                    className="admin-cell-muted admin-col-phone-hide"
                    data-label="Topic"
                  >
                    {page.categoryTitle ?? (
                      <span className="admin-cell-italic-faded">None</span>
                    )}
                  </td>
                  <td
                    className="admin-cell-code admin-col-tablet-hide admin-col-phone-hide"
                    data-label="Slug"
                  >
                    {page.slug}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/pages/${page.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
