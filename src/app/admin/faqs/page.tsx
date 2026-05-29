/**
 * FAQs List Page - Admin
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminFaqsTable from "@/components/AdminFaqsTable";
import AdminStatCard from "@/components/AdminStatCard";

export default async function FaqsPage() {
  const { service } = await getAdminApiService();

  const response = await service.getFaqsAdmin();
  const faqs = response.data || [];
  const publishedCount = faqs.filter((f) => f.status === "published").length;
  const groupCount = new Set(
    faqs.map((f) => (f.group || "").trim()).filter(Boolean),
  ).size;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Support content</div>
          <h1>FAQs</h1>
          <p className="admin-page-description">
            Manage the questions and answers shown on the public FAQ page.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">{faqs.length} FAQs</span>
          <Link href="/cms/faqs/new" className="admin-btn-save">
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
            New FAQ
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <AdminStatCard
            label="Total FAQs"
            value={faqs.length}
            valueSize="lg"
          />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard
            label="Published"
            value={publishedCount}
            valueSize="lg"
          />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Groups" value={groupCount} valueSize="lg" />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">Content</div>
            <h2 className="admin-section-card-title">FAQ list</h2>
            <p className="admin-section-card-copy">
              Sort by group or order to plan the public layout, then jump in to
              edit any entry.
            </p>
          </div>
        </div>
        <AdminFaqsTable faqs={faqs} />
      </section>
    </div>
  );
}
