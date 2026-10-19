import { apiService } from "@/lib/api";
import { toVisibleStatMap, type StatValueMap } from "@/lib/stats";

/**
 * Returns public, visible site stats from the backend. When the request fails,
 * callers get an empty map so UI can omit trust stats cleanly.
 */
export async function getPublicVisibleStats(): Promise<StatValueMap> {
  try {
    const response = await apiService.getStats();
    return toVisibleStatMap(response.data);
  } catch {
    return {};
  }
}
