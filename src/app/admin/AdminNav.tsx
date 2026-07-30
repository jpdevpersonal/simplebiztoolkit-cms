/**
 * Admin Navigation Component
 * Client component for grouped navigation, logout, and the mobile drawer
 */

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CircleHelp,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  ListTree,
  LogOut,
  Menu as MenuIcon,
  PanelTop,
  Tags,
  X,
  type LucideIcon,
} from "lucide-react";
import { CMS_LOGIN_PATH, CMS_HOME_PATH, toCmsPath } from "@/lib/adminRoutes";

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  icon: LucideIcon;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        href: CMS_HOME_PATH,
        label: "Dashboard",
        exact: true,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/cms/pages", label: "Pages", exact: false, icon: FileText },
      { href: "/cms/faqs", label: "FAQs", exact: false, icon: CircleHelp },
    ],
  },
  {
    label: "Navigation",
    items: [
      {
        href: "/cms/menu-manager",
        label: "Menu Manager",
        exact: false,
        icon: ListTree,
      },
      {
        href: "/cms/menu",
        label: "Menu Items",
        exact: false,
        icon: PanelTop,
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/cms/templates",
        label: "Templates",
        exact: false,
        icon: LayoutTemplate,
      },
      {
        href: "/cms/categories",
        label: "Template Categories",
        exact: false,
        icon: Tags,
      },
    ],
  },
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
  const cmsPathname = toCmsPath(pathname);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const brand = (
    <Link
      href={CMS_HOME_PATH}
      className="admin-nav-brand"
      onClick={() => setMenuOpen(false)}
    >
      <span className="admin-nav-brand-badge">
        <Image
          src="/images/simple-biz-toolkit-logo.png"
          alt=""
          width={30}
          height={30}
        />
      </span>
      <span className="admin-nav-brand-copy">
        <span className="admin-nav-brand-title">Simple Biz Toolkit</span>
        <span className="admin-nav-brand-subtitle">Content Studio</span>
      </span>
    </Link>
  );

  return (
    <>
      <header className="admin-mobile-header">
        {brand}
        <button
          type="button"
          className="admin-nav-burger"
          aria-expanded={menuOpen}
          aria-controls="admin-nav-collapse"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Dismiss navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="admin-nav-collapse"
        className={"admin-nav" + (menuOpen ? " is-open" : "")}
        aria-label="CMS navigation"
      >
        <div className="admin-nav-inner">
          <div className="admin-nav-sidebar-header">
            {brand}
            <button
              type="button"
              className="admin-nav-sidebar-close"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="admin-nav-groups" aria-label="CMS sections">
            {navGroups.map((group) => (
              <div className="admin-nav-group" key={group.label}>
                <div className="admin-nav-group-label">{group.label}</div>
                <div className="admin-nav-links">
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.exact, cmsPathname);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={"admin-nav-link" + (active ? " active" : "")}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={17} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="admin-nav-end">
            <div className="admin-nav-user-chip" title={userEmail}>
              <span className="admin-nav-user-avatar" aria-hidden="true">
                {userEmail.trim().charAt(0).toUpperCase() || "A"}
              </span>
              <span className="admin-nav-user-copy">
                <span className="admin-nav-user-label">Signed in</span>
                <span className="admin-nav-email">{userEmail}</span>
              </span>
            </div>
            <button
              type="button"
              className="admin-nav-logout"
              onClick={() => signOut({ callbackUrl: CMS_LOGIN_PATH })}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <AdminNavContent key={pathname} pathname={pathname} userEmail={userEmail} />
  );
}
