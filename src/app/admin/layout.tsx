/**
 * Admin Layout
 * Provides navigation and authentication check for all admin pages
 */

import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "./AdminNav";

export const metadata = {
  title: "Admin Dashboard | Simple Biz Toolkit",
  robots: "noindex, nofollow", // Prevent search engine indexing
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-layout">
      <AdminNav userEmail={session.user?.email || ""} />

      <main className="admin-content">
        <div className="container py-4">{children}</div>
      </main>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          background-color: var(--sb-bg-primary);
        }

        .admin-content {
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
