import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

const freeGuideDescription =
  "Get the free AI for Small Business guide by email and start saving time, cutting costs, and growing your business smarter.";

const freeTemplatesUnavailableDescription =
  "Free templates are not currently available. Browse the full template collection or visit Etsy for the latest downloads.";

export function getFreePageMetadata(showFreeGuideButton: boolean): Metadata {
  if (showFreeGuideButton) {
    return createPageMetadata({
      title: "Free AI Guide",
      description: freeGuideDescription,
      pathname: "/free",
      openGraphTitle: "Free AI Guide | Simple Biz Toolkit",
      twitterTitle: "Free AI Guide | Simple Biz Toolkit",
    });
  }

  return {
    ...createPageMetadata({
      title: "Free Templates",
      description: freeTemplatesUnavailableDescription,
      pathname: "/free",
      openGraphTitle: "Free Templates | Simple Biz Toolkit",
      twitterTitle: "Free Templates | Simple Biz Toolkit",
    }),
    robots: {
      index: false,
      follow: true,
    },
  };
}
