export type PublicAnalyticsEvent =
  | "cta_click"
  | "cta_impression"
  | "outbound_etsy_click"
  | "select_item";

export type PublicAnalyticsParams = {
  placement: string;
  destination_type?: "etsy" | "template" | "template_category" | "tool";
  category_slug?: string;
  product_slug?: string;
  item_name?: string;
};

type AnalyticsWindow = Window & {
  gtag?: (
    command: "event",
    eventName: PublicAnalyticsEvent,
    params: PublicAnalyticsParams,
  ) => void;
};

export function trackPublicEvent(
  eventName: PublicAnalyticsEvent,
  params: PublicAnalyticsParams,
): void {
  if (typeof window === "undefined") return;

  (window as AnalyticsWindow).gtag?.("event", eventName, params);
}
