"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteNavigation, { type MenuNavItem } from "./SiteNavigation";
import EtsyCtaButton from "@/components/EtsyCtaButton";

type Props = {
  menuNavItems?: MenuNavItem[];
};

export default function SiteHeader({ menuNavItems = [] }: Props) {
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
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--sb-border)",
        }}
      >
        <div className="container py-3 d-flex align-items-center justify-content-between gap-3 flex-nowrap sb-site-header-inner">
          <Link
            href="/"
            className="d-flex align-items-center gap-2 text-decoration-none sb-site-header-brand flex-shrink-0"
          >
            <Image
              src="/images/simple-biz-toolkit-logo.png"
              alt="Simple Biz Toolkit"
              width={72}
              height={72}
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
                <SiteNavigation menuNavItems={menuNavItems} />
              </div>

              <div className="d-flex align-items-center gap-2 sb-site-header-actions order-2 order-lg-3">
                <EtsyCtaButton className="d-none d-xl-inline-flex" />
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
