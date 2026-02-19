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
}: AdminFormBlockProps) {
  return (
    <div className={`admin-form-block${className ? ` ${className}` : ""}`}>
      <div className="admin-form-block-header">
        {icon}
        <span className="admin-form-block-title">{title}</span>
      </div>
      <div className="admin-form-block-body">{children}</div>
    </div>
  );
}
