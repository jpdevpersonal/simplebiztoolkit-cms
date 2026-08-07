import "@/styles/bootstrap-custom.scss";
import "@/styles/theme.css";
import { unstable_noStore as noStore } from "next/cache";

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

const NAV_FETCH_TIMEOUT_MS = 3000;

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
        getPublishedMenuItems({ requireComplete: true }),
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
          getPublishedMenuItemContent(item, { requireComplete: true }).then(
            (content) => ({ item, content }),
          ),
        ),
      ),
      NAV_FETCH_TIMEOUT_MS,
    );

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
    noStore();
    console.error("Failed to load tools navigation", error);
  }

  return (
    <>
      <SiteHeader menuNavItems={menuNavItems} navOrderIds={navOrderIds} />
      {children}
    </>
  );
}
