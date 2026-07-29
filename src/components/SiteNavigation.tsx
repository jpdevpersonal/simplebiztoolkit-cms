"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import { createPortal } from "react-dom";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import {
  composeOrderedMenuEntries,
  type MenuNavItem,
  type OrderedMenuEntry,
} from "@/lib/siteMenu";

type Props = { menuNavItems?: MenuNavItem[]; navOrderIds?: string[] };

export default function SiteNavigation({
  menuNavItems = [],
  navOrderIds = [],
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  // Treat the mobile panel as a modal dialog while it is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() =>
      closeButtonRef.current?.focus(),
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !menuPanelRef.current) return;

      const focusableElements = Array.from(
        menuPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const orderedNavItems = useMemo<OrderedMenuEntry[]>(
    () => composeOrderedMenuEntries(menuNavItems, navOrderIds),
    [menuNavItems, navOrderIds],
  );

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

  const closeMenu = () => {
    setIsOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const openMenu = () => {
    setIsOpen(true);
  };

  const mobileMenu = isOpen ? (
    <>
      <div
        className="sb-mobile-menu-backdrop"
        onClick={closeMenu}
        aria-hidden="true"
      />

      <div
        ref={menuPanelRef}
        id="site-navigation-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="sb-mobile-menu-panel"
      >
        <div className="sb-mobile-menu-header">
          <Link href="/" onClick={closeMenu} className="sb-mobile-menu-brand">
            Simple Biz Toolkit
          </Link>
          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            className="sb-mobile-menu-close"
            aria-label="Close menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="sb-mobile-menu-body">
          <nav className="sb-mobile-menu-nav" aria-label="Mobile navigation">
            {orderedNavItems.map((entry) => {
              if (entry.kind === "static") {
                const active = isActive(entry.to);
                return (
                  <Link
                    key={entry.orderId}
                    onClick={closeMenu}
                    href={entry.to}
                    className={
                      "sb-mobile-menu-link" + (active ? " is-active" : "")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    {entry.label}
                    <svg
                      className="sb-mobile-menu-chevron"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
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

              const item = entry.item;
              if (item.directHref) {
                const active = isActive(item.directHref);
                return (
                  <Link
                    key={entry.orderId}
                    onClick={closeMenu}
                    href={item.directHref}
                    className={
                      "sb-mobile-menu-link" + (active ? " is-active" : "")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    {item.title}
                    <svg
                      className="sb-mobile-menu-chevron"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
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
                  group.pages.map((page) => {
                    const active = isActive(page.href);
                    return (
                      <Link
                        key={page.id}
                        onClick={closeMenu}
                        href={page.href}
                        className={
                          "sb-mobile-menu-link sb-mobile-menu-link--nested" +
                          (active ? " is-active" : "")
                        }
                        aria-current={active ? "page" : undefined}
                      >
                        {page.title}
                      </Link>
                    );
                  }),
                );
              }

              return null;
            })}
          </nav>

          <div className="sb-mobile-menu-actions">
            {featureFlags.showFreeGuideButton && (
              <Link
                href={links.freebiePath}
                onClick={closeMenu}
                className="btn sb-btn-primary sb-mobile-menu-action"
              >
                Get your free guide
              </Link>
            )}
            <EtsyCtaButton onClick={closeMenu} />

            <div className="sb-mobile-menu-trust">
              <span aria-hidden="true">🔒</span> Secure checkout via Etsy
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="d-none d-lg-flex align-items-center sb-site-nav">
        {orderedNavItems.map((entry) =>
          entry.kind === "static" ? (
            <Link
              key={entry.orderId}
              className={
                "px-3 py-2 text-decoration-none nav-link sb-site-nav-link" +
                (isActive(entry.to) ? " is-active" : "")
              }
              href={entry.to}
              aria-current={isActive(entry.to) ? "page" : undefined}
            >
              {entry.label}
            </Link>
          ) : entry.item.directHref ? (
            <Link
              key={entry.orderId}
              className={
                "px-3 py-2 text-decoration-none nav-link sb-site-nav-link" +
                (isActive(entry.item.directHref) ? " is-active" : "")
              }
              href={entry.item.directHref}
              aria-current={
                isActive(entry.item.directHref) ? "page" : undefined
              }
            >
              {entry.item.title}
            </Link>
          ) : entry.item.groups && entry.item.groups.length > 0 ? (
            <div
              key={entry.orderId}
              className={
                "sb-nav-dropdown" +
                (isGroupActive(entry.item) ? " is-active" : "")
              }
            >
              <button
                className="px-3 py-2 text-decoration-none nav-link sb-site-nav-link sb-nav-dropdown-trigger"
                type="button"
                aria-haspopup="true"
              >
                {entry.item.title}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="sb-nav-dropdown-menu">
                {entry.item.groups.map((group, gi) => (
                  <div key={group.categoryId ?? gi}>
                    {group.categoryTitle && (
                      <div
                        className={
                          "sb-nav-dropdown-heading" +
                          (gi > 0 ? " sb-nav-dropdown-heading--divided" : "")
                        }
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
                        aria-current={isActive(page.href) ? "page" : undefined}
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
        ref={menuButtonRef}
        type="button"
        onClick={openMenu}
        aria-expanded={isOpen}
        className="d-lg-none ms-auto sb-mobile-menu-trigger"
        aria-label="Open menu"
        aria-controls="site-navigation-panel"
      >
        <span className="sb-mobile-menu-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {mounted && isOpen ? createPortal(mobileMenu, document.body) : null}
    </>
  );
}
