export const PRIMARY_MENU_LOCATION_KEY = "primary";
export const FOOTER_MENU_LOCATION_KEY = "sb-footer-main";

export const menuLocationOptions = [
  {
    key: PRIMARY_MENU_LOCATION_KEY,
    label: "Site navigation",
    description: "Header and mobile navigation",
  },
  {
    key: FOOTER_MENU_LOCATION_KEY,
    label: "Footer links",
    description: "Shop, Support, Company, and Explore links in the footer",
  },
] as const;

export type MenuLocationKey = (typeof menuLocationOptions)[number]["key"];

export function getMenuLocationOption(key: MenuLocationKey) {
  return menuLocationOptions.find((option) => option.key === key);
}
