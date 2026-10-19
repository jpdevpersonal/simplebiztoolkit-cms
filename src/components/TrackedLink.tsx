"use client";

import Link from "next/link";
import type { ComponentProps, MouseEventHandler } from "react";
import {
  trackPublicEvent,
  type PublicAnalyticsEvent,
  type PublicAnalyticsParams,
} from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: PublicAnalyticsEvent;
  eventParams: PublicAnalyticsParams;
};

export default function TrackedLink({
  eventName,
  eventParams,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackPublicEvent(eventName, eventParams);
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}
