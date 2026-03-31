import Link from "next/link";

export type BreadcrumbItem = { name: string; href: string };

type Props = {
  items: BreadcrumbItem[];
  /** Render as a bottom/footer breadcrumb with a top border */
  bottom?: boolean;
};

/**
 * Unified breadcrumb navigation trail used across all public pages.
 * Renders: ‹ Home › Section › Current Page
 *
 * All ancestor links are clickable; the last item is the current page
 * rendered as a non-linked span so screen readers announce aria-current.
 * The first link gets a subtle left-chevron icon to reinforce "back" navigation.
 */
export default function SiteBreadcrumb({ items, bottom = false }: Props) {
  const navClass = ["sb-breadcrumb", bottom ? "sb-breadcrumb--bottom" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClass} aria-label="Breadcrumb">
      <ol className="sb-breadcrumb-list" role="list">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <li className="sb-breadcrumb-item" key={item.href}>
              {isLast ? (
                <span className="sb-breadcrumb-current" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="sb-breadcrumb-link">
                  {isFirst && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                      aria-hidden="true"
                      className="sb-breadcrumb-back-icon"
                    >
                      <path
                        d="M7.5 1.5L3.5 5.5l4 4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {item.name}
                </Link>
              )}
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
