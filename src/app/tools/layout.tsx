import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/theme.css";

import SiteHeader from "@/components/SiteHeader";
import { PRIMARY_MENU_LOCATION_KEY } from "@/lib/menuLocations";
import type { MenuNavItem } from "@/lib/siteMenu";
import {
  getMenuLayoutOrderIds,
  getMenuItemLandingHref,
  getPublishedMenuItems,
  getPublishedMenuItemContent,
  orderMenuItemsByLayout,
} from "@/lib/menuContent";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuNavItems: MenuNavItem[] = [];
  let navOrderIds: string[] = [];

  try {
    const [publishedItemsRaw, layoutOrderIds] = await Promise.all([
      getPublishedMenuItems(),
      getMenuLayoutOrderIds(PRIMARY_MENU_LOCATION_KEY),
    ]);

    navOrderIds = layoutOrderIds;
    const publishedItems = orderMenuItemsByLayout(
      publishedItemsRaw,
      layoutOrderIds,
    );

    for (const item of publishedItems) {
      const content = await getPublishedMenuItemContent(item);
      if (content.totalPages === 0) continue;
      menuNavItems.push({
        id: item.id,
        title: item.title,
        directHref: getMenuItemLandingHref(content),
      });
    }
  } catch {
    // Navigation not critical — render header without nav items
  }

  return (
    <>
      <SiteHeader menuNavItems={menuNavItems} navOrderIds={navOrderIds} />
      {children}
    </>
  );
}
