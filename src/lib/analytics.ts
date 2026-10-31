export type PublicAnalyticsEvent =
  | "cta_click"
  | "cta_impression"
  | "outbound_etsy_click"
  | "select_item"
  | "tool_complete"
  | "file_export"
  | "sign_up";

export type PublicAnalyticsParams = {
  placement: string;
  destination_type?: "etsy" | "template" | "template_category" | "tool";
  category_slug?: string;
  product_slug?: string;
  item_name?: string;
  tool_name?: "profit_calculator" | "csv_profit_calculator" | "quote_generator";
  export_type?: "csv" | "xlsx" | "pdf";
};

type AnalyticsWindow = Window & {
  gtag?: (
    command: "event",
    eventName: PublicAnalyticsEvent | "page_view",
    params: PublicAnalyticsParams | { page_location: string },
  ) => void;
  __sbtLastPublicPageView?: string;
};

export function trackPublicEvent(
  eventName: PublicAnalyticsEvent,
  params: PublicAnalyticsParams,
): void {
  if (typeof window === "undefined") return;

  (window as AnalyticsWindow).gtag?.("event", eventName, params);
}

export function trackPublicPageView(pathname: string): void {
  if (typeof window === "undefined") return;

  const normalizedPath = pathname.split(/[?#]/, 1)[0] || "/";
  if (
    !normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("//") ||
    /^\/(?:admin|cms|api|auth|preview)(?:\/|$)/i.test(normalizedPath)
  ) {
    return;
  }

  const analyticsWindow = window as AnalyticsWindow;
  if (analyticsWindow.__sbtLastPublicPageView === normalizedPath) return;

  const pageLocation = new URL(normalizedPath, window.location.origin);
  if (pageLocation.origin !== window.location.origin) return;
  analyticsWindow.gtag?.("event", "page_view", {
    page_location: pageLocation.toString(),
  });
  analyticsWindow.__sbtLastPublicPageView = normalizedPath;
}
