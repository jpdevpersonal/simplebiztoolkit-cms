"use client";

import React from "react";

type AdminFormBlockProps = {
  /** Icon element rendered in the block header */
  icon: React.ReactNode;
  /** Section title shown in the block header */
  title: string;
  /** Block body content */
  children: React.ReactNode;
  /** Extra classes appended to the outer wrapper (e.g. "mb-0") */
  className?: string;
  /** Optional actions rendered on the right side of the header */
  headerActions?: React.ReactNode;
};

/**
 * Shared card-style section wrapper used by admin content editors.
 * Renders the standard `.admin-form-block` structure with an icon + title
 * header and a body region for its children.
 */
export default function AdminFormBlock({
  icon,
  title,
  children,
  className,
  headerActions,
}: AdminFormBlockProps) {
  const hasBody = React.Children.toArray(children).length > 0;

  return (
    <div className={`admin-form-block${className ? ` ${className}` : ""}`}>
      <div className="admin-form-block-header">
        <div className="admin-form-block-heading">
          <span className="admin-form-block-icon" aria-hidden="true">
            {icon}
          </span>
          <div className="admin-form-block-title-wrap">
            <span className="admin-form-block-title">{title}</span>
          </div>
        </div>
        {headerActions ? (
          <div className="admin-form-block-actions">{headerActions}</div>
        ) : null}
      </div>
      {hasBody ? <div className="admin-form-block-body">{children}</div> : null}
    </div>
  );
}
