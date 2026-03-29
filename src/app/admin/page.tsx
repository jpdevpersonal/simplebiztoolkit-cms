/**
 * Admin Dashboard Home Page
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminStatCard from "@/components/AdminStatCard";

export default async function AdminDashboard() {
  const { service } = await getAdminApiService();

  const [
    articlesResponse,
    categoriesResponse,
    pagesResponse,
    menuItemsResponse,
  ] = await Promise.all([
    service.getAllArticles(),
    service.getProductCategories(),
    service.getMenuItemPages(),
    service.getMenuItems(),
  ]);

  const articles = articlesResponse.data || [];
  const categories = categoriesResponse.data || [];
  const products = categories.flatMap((cat) => cat.items || []);
  const pages = pagesResponse.data || [];
  const menuItems = menuItemsResponse.data || [];

  const publishedArticles = articles.filter(
    (a) => a.status === "published",
  ).length;
  const draftArticles = articles.filter((a) => a.status === "draft").length;

  const quickLinks = [
    {
      href: "/admin/articles",
      label: "Manage Articles",
      description: `${articles.length} articles`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polyline
            points="10 9 9 9 8 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/products",
      label: "Manage Templates",
      description: `${products.length} templates`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
      ),
    },
    {
      href: "/admin/categories",
      label: "Manage Template Categories",
      description: `${categories.length} categories`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      href: "/admin/menu",
      label: "Manage Menu Items",
      description: `${menuItems.length} menu items`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12h18M3 6h18M3 18h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/menu-manager",
      label: "Menu Manager",
      description: "Drag, reorder, and hide top-level navigation",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/pages",
      label: "Manage Pages",
      description: `${pages.length} pages`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
      ),
    },
  ];

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Operations overview</div>
          <h1>Dashboard</h1>
          <p className="admin-page-description">
            Keep content, templates, navigation, and supporting pages aligned
            from one brand-focused workspace.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/articles/new" className="admin-btn-save">
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
            New Article
          </Link>
          <Link href="/" className="admin-btn-cancel">
            View Site
          </Link>
        </div>
      </div>

      <section className="admin-hero-card">
        <div className="admin-hero-copy">
          <span className="admin-page-meta admin-page-meta-lg">
            {articles.length} articles · {products.length} templates ·{" "}
            {pages.length} pages
          </span>
          <h2>Clear section boundaries, faster content decisions</h2>
          <p>
            The admin area is organized around the core publishing flows so the
            most important actions stay visible on large and small screens.
          </p>
        </div>
        <div className="admin-hero-highlights">
          <div className="admin-hero-highlight">
            <strong>{publishedArticles}</strong>
            <span>Published articles live</span>
          </div>
          <div className="admin-hero-highlight">
            <strong>{draftArticles}</strong>
            <span>Drafts ready for review</span>
          </div>
        </div>
      </section>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Total Articles"
            value={articles.length}
            note={`${publishedArticles} published · ${draftArticles} draft`}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-lg-3">
          <AdminStatCard
            label="Templates"
            value={products.length}
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
          <AdminStatCard label="Pages" value={pages.length} valueSize="lg" />
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
                  Jump into each operational area with clear counts and a single
                  next action.
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
                  <span className="admin-quick-link-icon">{link.icon}</span>
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
              <Link href="/admin/articles/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
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
                </span>
                <span className="admin-quick-link-copy">
                  <span className="admin-quick-link-title">New Article</span>
                  <span className="admin-quick-link-description">
                    Start a new blog post draft.
                  </span>
                </span>
              </Link>
              <Link href="/admin/products/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
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
