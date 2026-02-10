/**
 * Admin Navigation Component
 * Client component for logout functionality
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/articles", label: "Articles" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
  ];

  return (
    <nav
      className="sb-card"
      style={{
        padding: "1rem 2rem",
        marginBottom: "2rem",
        borderRadius: 0,
        borderBottom: "2px solid var(--sb-border-color)",
      }}
    >
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4 align-items-center">
            <Link
              href="/admin"
              style={{
                fontWeight: 700,
                fontSize: "1.25rem",
                textDecoration: "none",
              }}
            >
              CMS Admin
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  fontWeight: pathname === item.href ? 600 : 400,
                  color:
                    pathname === item.href ? "var(--sb-brand-blue)" : "inherit",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="d-flex gap-3 align-items-center">
            <span className="sb-muted" style={{ fontSize: "0.875rem" }}>
              {userEmail}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="btn btn-sm sb-btn-ghost"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
