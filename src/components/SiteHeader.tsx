"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteNavigation from "./SiteNavigation";
import type { MenuNavItem } from "@/lib/siteMenu";

type Props = {
  menuNavItems?: MenuNavItem[];
  navOrderIds?: string[];
};

export default function SiteHeader({
  menuNavItems = [],
  navOrderIds = [],
}: Props) {
  const pathname = usePathname();
  const isAdmin =
    pathname?.startsWith("/admin") || pathname?.startsWith("/cms");

  return (
    <header className="sb-site-header">
      <div className="container d-flex align-items-center justify-content-between gap-3 flex-nowrap sb-site-header-inner">
        <Link
          href="/"
          className="d-flex align-items-center gap-2 text-decoration-none sb-site-header-brand flex-shrink-0"
        >
          <Image
            src="/images/simple-biz-toolkit-logo.png"
            alt=""
            width={44}
            height={44}
            className="sb-header-logo"
          />
          <span className="sb-brand-title">Simple Biz Toolkit</span>
        </Link>

        {!isAdmin && (
          <div className="d-flex align-items-center">
            <SiteNavigation
              menuNavItems={menuNavItems}
              navOrderIds={navOrderIds}
            />
          </div>
        )}
      </div>
    </header>
  );
}
