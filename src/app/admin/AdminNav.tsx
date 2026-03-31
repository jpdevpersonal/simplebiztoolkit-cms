/**
 * Admin Navigation Component
 * Client component for logout functionality and mobile menu toggle
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Templates", exact: false },
  { href: "/admin/categories", label: "Template Categories", exact: false },
  { href: "/admin/menu-manager", label: "Menu Manager", exact: false },
  { href: "/admin/menu", label: "Menu Items", exact: false },
  { href: "/admin/pages", label: "Pages", exact: false },
];

function isActive(href: string, exact: boolean, pathname: string): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function AdminNavContent({
  pathname,
  userEmail,
}: {
  pathname: string;
  userEmail: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="admin-nav">
      <div className="container">
        <div className="admin-nav-inner">
          <div className="admin-nav-top-row">
            <Link href="/admin" className="admin-nav-brand">
              <span className="admin-nav-brand-badge">
                <Image
                  src="/images/simple-biz-toolkit-logo.png"
                  alt="Simple Biz Toolkit"
                  width={28}
                  height={28}
                  style={{ borderRadius: 6 }}
                />
              </span>
              <span className="admin-nav-brand-copy">
                <span className="admin-nav-brand-title">
                  Simple Biz Toolkit
                </span>
                <span className="admin-nav-brand-subtitle">
                  Admin workspace
                </span>
              </span>
            </Link>

            <button
              type="button"
              className="admin-nav-burger"
              aria-expanded={menuOpen}
              aria-controls="admin-nav-collapse"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6 6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          <div
            id="admin-nav-collapse"
            className={"admin-nav-collapse" + (menuOpen ? " is-open" : "")}
          >
            <div className="admin-nav-links-wrap" aria-label="Admin sections">
              <div className="admin-nav-links">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "admin-nav-link" +
                      (isActive(item.href, item.exact, pathname)
                        ? " active"
                        : "")
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="admin-nav-end">
              <div className="admin-nav-user-chip" title={userEmail}>
                <span className="admin-nav-user-label">Signed in</span>
                <span className="admin-nav-email">{userEmail}</span>
              </div>
              <button
                className="admin-nav-logout"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <AdminNavContent key={pathname} pathname={pathname} userEmail={userEmail} />
  );
}
