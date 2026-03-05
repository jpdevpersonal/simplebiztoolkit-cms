/**
 * Editor Controls List Page - Admin
 * Lists all editor control presets with status badges.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EditorControlPreset } from "@/types/editorControls";
import { clientApi } from "@/lib/clientApi";
import AdminStatCard from "@/components/AdminStatCard";

function StatusBadge({ status }: { status?: string }) {
  const approved = status === "approved";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: approved ? "#dcfce7" : "#fef9c3",
        color: approved ? "#166534" : "#854d0e",
      }}
    >
      {status ?? "draft"}
    </span>
  );
}

const blockTypeLabels: Record<string, string> = {
  paragraph: "¶ Paragraph",
  callout: "💬 Callout",
  cta: "📣 CTA",
  image: "🖼️ Image",
};

export default function EditorControlsPage() {
  const [controls, setControls] = useState<EditorControlPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApi
      .getEditorControls()
      .then(setControls)
      .catch(() => setControls([]))
      .finally(() => setLoading(false));
  }, []);

  const approved = controls.filter((c) => c.status === "approved").length;
  const drafts = controls.filter((c) => c.status === "draft").length;

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Editor Controls</h1>
        <Link href="/admin/editor-controls/new" className="admin-btn-save">
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
          New Control
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <AdminStatCard label="Total Controls" value={controls.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Approved" value={approved} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Drafts" value={drafts} />
        </div>
      </div>

      {/* Controls table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Block Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && controls.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  No editor controls found. Create your first control!
                </td>
              </tr>
            )}
            {controls.map((control) => (
              <tr key={control.id}>
                <td style={{ fontWeight: 600 }}>{control.name}</td>
                <td style={{ fontSize: "0.9rem" }}>
                  {blockTypeLabels[control.blockType] || control.blockType}
                </td>
                <td>
                  <StatusBadge status={control.status} />
                </td>
                <td>
                  <Link
                    href={`/admin/editor-controls/${control.id}/edit`}
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
    </div>
  );
}
