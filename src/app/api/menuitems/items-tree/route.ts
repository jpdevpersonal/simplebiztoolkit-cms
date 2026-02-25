/**
 * Menu Items – full hierarchy tree (public)
 * GET – proxies to the backend GetItemAndChildren() endpoint which returns each
 *       menu item together with its nested categories and pages.
 */

import { proxyToBackend } from "@/lib/apiProxy";

export async function GET() {
  return proxyToBackend({
    request: null,
    path: "/api/menuitems/items-tree",
    method: "GET",
  });
}
