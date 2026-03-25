"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import { createPortal } from "react-dom";
import EtsyCtaButton from "@/components/EtsyCtaButton";

/** Shape passed from server components – fully serialisable */
export type MenuNavPage = { id: string; title: string; href: string };
export type MenuNavGroup = {
  categoryId?: string;
  categoryTitle?: string;
  pages: MenuNavPage[];
};
export type MenuNavItem = {
  id: string;
  title: string;
  /** Set when the item links directly to a single page (no dropdown needed) */
  directHref?: string;
  /** Set when the item should render as a dropdown */
  groups?: MenuNavGroup[];
};

type Props = { menuNavItems?: MenuNavItem[] };

export default function SiteNavigation({ menuNavItems = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // Avoid SSR/client mismatch: portals can only exist after mount.
  useEffect(() => {
    const handle = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(handle);
  }, []);

  // Close menu only when route actually changes
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    const handle = setTimeout(() => setIsOpen(false), 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { to: "/products", label: "Templates" },
    { to: "/blog", label: "Resources" },
    { to: "/testimonials", label: "Reviews" },
    { to: "/faq", label: "FAQ" },
    { to: "/help", label: "Help" },
    { to: "/contact", label: "Contact" },
    { to: "/about", label: "About" },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (item: MenuNavItem) => {
    if (item.directHref) return isActive(item.directHref);

    return (
      item.groups?.some((group) =>
        group.pages.some((page) => isActive(page.href)),
      ) ?? false
    );
  };

  const closeMenu = () => setIsOpen(false);

  const mobileMenu = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            zIndex: 9998,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        id="site-navigation-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(85vw, 320px)",
          backgroundColor: "white",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxShadow: isOpen ? "-5px 0 25px rgba(0, 0, 0, 0.15)" : "none",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1f9d6d 0%, #0d5c3f 100%)",
            color: "white",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Link
              href="/"
              onClick={closeMenu}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <p style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                Simple Biz Toolkit
              </p>
            </Link>
          </div>
          <button
            onClick={closeMenu}
            style={{
              border: "none",
              background: "transparent",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
            aria-label="Close menu"
          >
            <span
              aria-hidden="true"
              style={{ fontSize: "40px", lineHeight: 1, fontWeight: 700 }}
            >
              ×
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fafafa" }}>
          <nav style={{ padding: "0.5rem 0" }}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                onClick={closeMenu}
                href={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "1rem 1.5rem",
                  textDecoration: "none",
                  color: "var(--sb-ink)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  backgroundColor: "white",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "var(--sb-brand-blue)",
                    borderRadius: "50%",
                    marginRight: "1rem",
                  }}
                />
                {item.label}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginLeft: "auto", opacity: 0.4 }}
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}

            {/* Dynamic menu items from CMS */}
            {menuNavItems.map((item) => {
              if (item.directHref) {
                return (
                  <Link
                    key={item.id}
                    onClick={closeMenu}
                    href={item.directHref}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "1rem 1.5rem",
                      textDecoration: "none",
                      color: "var(--sb-ink)",
                      fontWeight: 600,
                      fontSize: "1rem",
                      backgroundColor: "white",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        backgroundColor: "var(--sb-brand-blue)",
                        borderRadius: "50%",
                        marginRight: "1rem",
                      }}
                    />
                    {item.title}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginLeft: "auto", opacity: 0.4 }}
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                );
              }
              if (item.groups && item.groups.length > 0) {
                return item.groups.flatMap((group) =>
                  group.pages.map((page) => (
                    <Link
                      key={page.id}
                      onClick={closeMenu}
                      href={page.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.875rem 1.5rem 0.875rem 2.5rem",
                        textDecoration: "none",
                        color: "var(--sb-ink)",
                        fontWeight: 500,
                        fontSize: "0.9375rem",
                        backgroundColor: "white",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          backgroundColor: "var(--sb-muted)",
                          borderRadius: "50%",
                          marginRight: "0.875rem",
                          flexShrink: 0,
                        }}
                      />
                      {page.title}
                    </Link>
                  )),
                );
              }
              return null;
            })}
          </nav>

          {/* Action Buttons */}
          <div style={{ padding: "1.5rem" }}>
            {featureFlags.showFreeGuideButton && (
              <Link
                href={links.freebiePath}
                onClick={closeMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.875rem 1rem",
                  marginBottom: "0.75rem",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: "8px",
                  background: "var(--sb-green)",
                  color: "white",
                  border: "none",
                }}
              >
                Get your free guide
              </Link>
            )}
            <EtsyCtaButton onClick={closeMenu} />

            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.875rem",
                backgroundColor: "white",
                borderRadius: "8px",
                textAlign: "center",
                border: "1px solid var(--sb-border)",
                fontSize: "0.8125rem",
              }}
            >
              <div style={{ color: "var(--sb-muted)", fontWeight: 500 }}>
                🔒 Secure checkout via Etsy
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="d-none d-lg-flex align-items-center gap-2 sb-site-nav">
        {navItems.map((item) => (
          <Link
            key={item.to}
            className={
              "px-3 py-2 text-decoration-none sb-muted rounded-pill nav-link sb-site-nav-link" +
              (isActive(item.to) ? " is-active" : "")
            }
            href={item.to}
            // Prevent automatic prefetch for the blog route to avoid
            // preloading its CSS when users may not navigate there.
            prefetch={item.to === "/blog" ? false : undefined}
            style={{ transition: "all 0.2s ease" }}
          >
            {item.label}
          </Link>
        ))}

        {/* Dynamic menu items from CMS */}
        {menuNavItems.map((item) =>
          item.directHref ? (
            <Link
              key={item.id}
              className={
                "px-3 py-2 text-decoration-none sb-muted rounded-pill nav-link sb-site-nav-link" +
                (isActive(item.directHref) ? " is-active" : "")
              }
              href={item.directHref}
              style={{ transition: "all 0.2s ease" }}
            >
              {item.title}
            </Link>
          ) : item.groups && item.groups.length > 0 ? (
            <div
              key={item.id}
              className={
                "sb-nav-dropdown" + (isGroupActive(item) ? " is-active" : "")
              }
              style={{ position: "relative" }}
            >
              <button
                className="px-3 py-2 text-decoration-none sb-muted rounded-pill nav-link sb-site-nav-link sb-nav-dropdown-trigger"
                type="button"
                style={{
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {item.title}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                className="sb-nav-dropdown-menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  minWidth: "220px",
                  background: "white",
                  border: "1px solid var(--sb-border)",
                  borderRadius: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: "0.5rem 0",
                  zIndex: 1050,
                }}
              >
                {item.groups.map((group, gi) => (
                  <div key={group.categoryId ?? gi}>
                    {group.categoryTitle && (
                      <div
                        style={{
                          padding: "0.35rem 1rem",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--sb-muted)",
                          borderTop:
                            gi > 0 ? "1px solid var(--sb-border)" : undefined,
                          marginTop: gi > 0 ? "0.4rem" : undefined,
                        }}
                      >
                        {group.categoryTitle}
                      </div>
                    )}
                    {group.pages.map((page) => (
                      <Link
                        key={page.id}
                        href={page.href}
                        className={
                          "sb-nav-dropdown-item" +
                          (isActive(page.href) ? " is-active" : "")
                        }
                        style={{
                          display: "block",
                          padding: "0.5rem 1rem",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        }}
                      >
                        {page.title}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="d-lg-none ms-auto"
        type="button"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen(true);
        }}
        aria-expanded={isOpen}
        style={{
          border: "none",
          background: "rgba(0,0,0,0.04)",
          color: "var(--sb-ink)",
          padding: 0,
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(16,24,40,0.06)",
          transition: "background-color 0.15s ease, transform 0.12s ease",
          paddingRight: "10px",
        }}
        aria-label="Open menu"
        aria-controls="site-navigation-panel"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              width: "28px",
              height: "3px",
              backgroundColor: "currentColor",
              borderRadius: "2px",
              boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
              transition: "transform 150ms ease, opacity 150ms ease",
            }}
          />
          <div
            style={{
              width: "28px",
              height: "3px",
              backgroundColor: "currentColor",
              borderRadius: "2px",
              boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
              transition: "transform 150ms ease, opacity 150ms ease",
            }}
          />
          <div
            style={{
              width: "28px",
              height: "3px",
              backgroundColor: "currentColor",
              borderRadius: "2px",
              boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
              transition: "transform 150ms ease, opacity 150ms ease",
            }}
          />
        </div>
      </button>

      {/* Portal the mobile menu to body to avoid z-index issues */}
      {mounted ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
