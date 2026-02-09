"use client";

import { usePathname } from "next/navigation";
import { links } from "@/config/links";
import type { AnchorHTMLAttributes } from "react";

interface EtsyCtaButtonProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> {
  label?: string;
  href?: string;
  className?: string;
  hideOnHome?: boolean;
}

export default function EtsyCtaButton({
  label = "Visit our Etsy Shop",
  href = links.etsyShopUrl,
  className,
  hideOnHome = true,
  ...rest
}: EtsyCtaButtonProps) {
  const pathname = usePathname();
  if (hideOnHome && pathname === "/") return null;

  const classes = ["ctaButton", className].filter(Boolean).join(" ");

  return (
    <a
      className={classes}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {label}
    </a>
  );
}
