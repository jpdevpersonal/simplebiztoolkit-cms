/**
 * Admin Dashboard Home Page
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminStatCard from "@/components/AdminStatCard";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
}

export default async function AdminDashboard() {
  const { service } = await getAdminApiService();

  const [categoriesResponse, pagesResponse, menuItemsResponse] =
    await Promise.all([
      service.getProductCategories(),
      service.getMenuItemPages(),
      service.getMenuItems(),
    ]);

  const categories = categoriesResponse.data || [];
  const products = categories.flatMap((category) => category.items || []);
  const pages = pagesResponse.data || [];
  const menuItems = menuItemsResponse.data || [];

  const publishedPages = pages.filter(
    (page) => page.status === "published",
  ).length;
  const draftPages = pages.filter((page) => page.status === "draft").length;

  const quickLinks = [
    {
      href: "/admin/templates",
      label: "Manage Templates",
      description: `${products.length} templates`,
    },
    {
      href: "/admin/categories",
      label: "Template Categories",
      description: `${categories.length} categories`,
    },
    {
      href: "/admin/pages",
      label: "Manage Pages",
      description: `${pages.length} pages`,
    },
    {
      href: "/admin/menu",
      label: "Manage Menu Items",
      description: `${menuItems.length} menu items`,
    },
    {
      href: "/admin/menu-manager",
      label: "Menu Manager",
      description: "Reorder and hide built-in navigation links",
    },
  ];

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Operations overview</div>
          <h1>Dashboard</h1>
          <p className="admin-page-description">
            Keep templates, pages, and navigation aligned from one brand-focused
            workspace.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/pages/new" className="admin-btn-save">
            <PlusIcon />
            New Page
          </Link>
          <Link href="/" className="admin-btn-cancel">
            View Site
          </Link>
        </div>
      </div>

      <section className="admin-hero-card">
        <div className="admin-hero-copy">
          <span className="admin-page-meta admin-page-meta-lg">
            {products.length} templates · {pages.length} pages ·{" "}
            {menuItems.length} menu items
          </span>
          <h2>Clear section boundaries, faster content decisions</h2>
          <p>
            The admin area stays focused on the publishing flows still active on
            the site: templates, navigation, and CMS-driven pages.
          </p>
        </div>
        <div className="admin-hero-highlights">
          <div className="admin-hero-highlight">
            <strong>{publishedPages}</strong>
            <span>Published pages live</span>
          </div>
          <div className="admin-hero-highlight">
            <strong>{draftPages}</strong>
            <span>Draft pages ready for review</span>
          </div>
        </div>
      </section>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Templates"
            value={products.length}
            note={`${categories.length} categories`}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Pages"
            value={pages.length}
            note={`${publishedPages} published · ${draftPages} draft`}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Menu Items"
            value={menuItems.length}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Categories"
            value={categories.length}
            valueSize="lg"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <section className="admin-section-card h-100">
            <div className="admin-section-card-header">
              <div>
                <div className="admin-section-card-eyebrow">Navigate</div>
                <h2 className="admin-section-card-title">Content management</h2>
                <p className="admin-section-card-copy">
                  Jump into each active operational area with clear counts and a
                  single next action.
                </p>
              </div>
            </div>
            <div className="d-flex flex-column gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="admin-quick-link"
                >
                  <span className="admin-quick-link-copy">
                    <span className="admin-quick-link-title">{link.label}</span>
                    <span className="admin-quick-link-description">
                      {link.description}
                    </span>
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="admin-quick-link-arrow"
                  >
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="col-md-6">
          <section className="admin-section-card h-100">
            <div className="admin-section-card-header">
              <div>
                <div className="admin-section-card-eyebrow">Create</div>
                <h2 className="admin-section-card-title">Quick create</h2>
                <p className="admin-section-card-copy">
                  Launch the most common creation flows without leaving the
                  dashboard.
                </p>
              </div>
            </div>
            <div className="d-flex flex-column gap-2">
              <Link href="/admin/templates/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <PlusIcon />
                </span>
                <span className="admin-quick-link-copy">
                  <span className="admin-quick-link-title">New Template</span>
                  <span className="admin-quick-link-description">
                    Add a new product template offer.
                  </span>
                </span>
              </Link>
              <Link href="/admin/pages/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <PlusIcon />
                </span>
                <span className="admin-quick-link-copy">
                  <span className="admin-quick-link-title">New Page</span>
                  <span className="admin-quick-link-description">
                    Publish a menu or topic page.
                  </span>
                </span>
              </Link>
              <Link href="/admin/menu/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <PlusIcon />
                </span>
                <span className="admin-quick-link-copy">
                  <span className="admin-quick-link-title">New Menu Item</span>
                  <span className="admin-quick-link-description">
                    Add another navigation entry point.
                  </span>
                </span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
