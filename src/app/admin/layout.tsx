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

  return (
    <div className="admin-layout">
      {session ? <AdminNav userEmail={session.user?.email || ""} /> : null}

      <main className="admin-content">
        <div className="container py-4">{children}</div>
      </main>

      {/* styles moved to global theme.css to keep this component server-safe */}
    </div>
  );
}
