import "@/styles/bootstrap-custom.scss";
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

const NAV_FETCH_TIMEOUT_MS = 900;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuNavItems: MenuNavItem[] = [];
  let navOrderIds: string[] = [];

  try {
    const [publishedItemsRaw, layoutOrderIds] = await withTimeout(
      Promise.all([
        getPublishedMenuItems(),
        getMenuLayoutOrderIds(PRIMARY_MENU_LOCATION_KEY),
      ]),
      NAV_FETCH_TIMEOUT_MS,
    );

    const publishedItems = orderMenuItemsByLayout(
      publishedItemsRaw,
      layoutOrderIds,
    );

    const menuContents = await withTimeout(
      Promise.all(
        publishedItems.map((item) =>
          getPublishedMenuItemContent(item).then((content) => ({
            item,
            content,
          })),
        ),
      ),
      NAV_FETCH_TIMEOUT_MS,
    );

    // Only commit navOrderIds after all content fetches succeed so that a
    // partial failure does not leave navOrderIds set while menuNavItems stays
    // empty — which would cause CMS items (Guides, Tools) to disappear and
    // strip static items like FAQ via hidden-static tokens.
    navOrderIds = layoutOrderIds;

    for (const { item, content } of menuContents) {
      if (content.totalPages === 0) continue;
      menuNavItems.push({
        id: item.id,
        title: item.title,
        directHref: getMenuItemLandingHref(content),
      });
    }
  } catch (error) {
    console.error("Failed to load tools navigation", error);
    // Navigation not critical — render header without nav items
  }

  return (
    <>
      <SiteHeader menuNavItems={menuNavItems} navOrderIds={navOrderIds} />
      {children}
    </>
  );
}
