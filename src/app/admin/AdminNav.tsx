/**
 * Admin Navigation Component
 * Client component for logout functionality
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/articles", label: "Articles", exact: false },
  { href: "/admin/products", label: "Products", exact: false },
  { href: "/admin/categories", label: "Product Categories", exact: false },
  { href: "/admin/menu", label: "Menu Items", exact: false },
  { href: "/admin/pages", label: "Pages", exact: false },
];

function isActive(href: string, exact: boolean, pathname: string): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav">
      <div className="container">
        <div className="admin-nav-inner">
          {/* Brand + nav links */}
          <div className="admin-nav-start">
            <Link href="/admin" className="admin-nav-brand">
              <span className="admin-nav-brand-badge">CMS</span>
              Admin
            </Link>

            <div className="admin-nav-links">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "admin-nav-link" +
                    (isActive(item.href, item.exact, pathname) ? " active" : "")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User info + logout */}
          <div className="admin-nav-end">
            <span className="admin-nav-email" title={userEmail}>
              {userEmail}
            </span>
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
    </nav>
  );
}
