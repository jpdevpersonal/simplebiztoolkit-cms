/**
 * Site Statistics Page - Admin
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminStatCard from "@/components/AdminStatCard";
import StatsEditor from "@/components/StatsEditor";
import { STAT_NAMES, toVisibleStatMap } from "@/lib/stats";

export default async function StatsPage() {
  const { service } = await getAdminApiService();

  const response = await service.getStatsAdmin();
  const stats = response.data ?? [];
  const visibleCount = Object.keys(toVisibleStatMap(stats)).length;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Site content</div>
          <h1>Site Statistics</h1>
          <p className="admin-page-description">
            Edit the Etsy trust figures shown on the public home page, and
            choose which of them are visible.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">
            {visibleCount} of {STAT_NAMES.length} visible
          </span>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <AdminStatCard
            label="Tracked statistics"
            value={STAT_NAMES.length}
            valueSize="lg"
          />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Visible" value={visibleCount} valueSize="lg" />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard
            label="Hidden"
            value={STAT_NAMES.length - visibleCount}
            valueSize="lg"
          />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">Home page</div>
            <h2 className="admin-section-card-title">Trust bar values</h2>
            <p className="admin-section-card-copy">
              Save a single statistic, or update all four together.
            </p>
          </div>
        </div>
        <StatsEditor stats={stats} loadError={response.error ?? null} />
      </section>
    </div>
  );
}
