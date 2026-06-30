export type Tool = {
  slug: string;
  title: string;
  /** Short benefit line shown under the title (mirrors Product.problem). */
  tagline: string;
  /** Short benefit phrases shown as a checklist. */
  bullets: string[];
  /** Thumbnail screenshot path, e.g. /images/tools/featured/profit-calculator.webp */
  image: string;
  /** Internal route to the tool, e.g. /tools/profit-calculator */
  href: string;
};
