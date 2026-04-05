import Link from "next/link";

export type BreadcrumbItem = { name: string; href: string };

type Props = {
  items: BreadcrumbItem[];
  /** Render as a bottom/footer breadcrumb with a top border */
  bottom?: boolean;
};

/**
 * Unified breadcrumb navigation trail used across all public pages.
 * Renders navigable ancestors only — the current page is intentionally
 * omitted so every visible item is a clickable back-navigation link.
 *
 * Pass the full trail (including current page as the last item);
 * the component automatically drops the final entry.
 * On narrow screens (≤576 px) only the direct parent is shown.
 */
export default function SiteBreadcrumb({ items, bottom = false }: Props) {
  // Show only navigable ancestors — drop the current page (last item)
  const ancestors = items.slice(0, -1);

  if (ancestors.length === 0) return null;

  const navClass = ["sb-breadcrumb", bottom ? "sb-breadcrumb--bottom" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClass} aria-label="Breadcrumb">
      <ol className="sb-breadcrumb-list" role="list">
        {ancestors.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === ancestors.length - 1;

          return (
            <li className="sb-breadcrumb-item" key={item.href}>
              <Link href={item.href} className="sb-breadcrumb-link">
                {isFirst && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    className="sb-breadcrumb-back-icon"
                  >
                    <path
                      d="M8 2L4 6l4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.name}
              </Link>
              {!isLast && (
                <span className="sb-breadcrumb-sep" aria-hidden="true">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
