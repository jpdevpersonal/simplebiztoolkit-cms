import { Fragment } from "react";
import Link from "next/link";

export type AdminBreadcrumbItem = {
  href: string;
  label: string;
};

type Props = {
  items: AdminBreadcrumbItem[];
  ariaLabel?: string;
};

export default function AdminBreadcrumbs({
  items,
  ariaLabel = "Breadcrumb",
}: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="admin-breadcrumb" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <Fragment key={`${item.href}-${item.label}`}>
          {index > 0 && (
            <span className="admin-breadcrumb-separator" aria-hidden="true">
              /
            </span>
          )}
          <Link
            href={item.href}
            className={`admin-breadcrumb-link${index === 0 ? " admin-breadcrumb-link-root" : ""}`}
          >
            {index === 0 && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="admin-breadcrumb-icon"
              >
                <path
                  d="M10 3l-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span>{item.label}</span>
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
