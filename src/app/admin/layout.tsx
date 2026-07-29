import React from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import AdminNav from "./AdminNav";
import "@/styles/bootstrap-custom.scss";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: "Content Studio | Simple Biz Toolkit",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div
      className={
        session ? "admin-layout admin-layout-authenticated" : "admin-layout"
      }
    >
      {session ? <AdminNav userEmail={session.user?.email || ""} /> : null}

      <main className="admin-content">
        <div className="admin-content-inner">
          <div className="admin-shell">{children}</div>
        </div>
      </main>
    </div>
  );
}
