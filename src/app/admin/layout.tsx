import React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import AdminNav from "./AdminNav";

export const metadata: Metadata = {
  title: "Admin Dashboard | Simple Biz Toolkit",
  robots: "noindex, nofollow",
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
    </div>
  );
}
