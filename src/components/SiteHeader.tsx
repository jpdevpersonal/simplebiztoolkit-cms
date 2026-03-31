"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteNavigation, { type MenuNavItem } from "./SiteNavigation";

type Props = {
  menuNavItems?: MenuNavItem[];
  navOrderIds?: string[];
};

export default function SiteHeader({
  menuNavItems = [],
  navOrderIds = [],
}: Props) {
  const headerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <header
        ref={headerRef}
        className="sb-site-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1030,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--sb-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <div className="container py-3 py-lg-2 d-flex align-items-center justify-content-between gap-3 flex-nowrap sb-site-header-inner">
          <Link
            href="/"
            className="d-flex align-items-center gap-2 text-decoration-none sb-site-header-brand flex-shrink-0"
          >
            <Image
              src="/images/simple-biz-toolkit-logo.png"
              alt="Simple Biz Toolkit"
              width={72}
              height={72}
              className="sb-header-logo"
              style={{ borderRadius: 10, border: "1px solid var(--sb-border)" }}
              priority
            />
            <div>
              <div className="sb-brand-title">Simple Biz Toolkit</div>
            </div>
          </Link>

          {!isAdmin && (
            <>
              <div className="order-3 order-lg-2 d-flex align-items-center">
                <SiteNavigation
                  menuNavItems={menuNavItems}
                  navOrderIds={navOrderIds}
                />
              </div>
            </>
          )}
        </div>
      </header>

      {/* spacer to prevent content from sitting under the fixed header */}
      <div className="sb-header-spacer" aria-hidden />
    </>
  );
}
