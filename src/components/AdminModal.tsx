"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type AdminModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  title: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
};

export default function AdminModal({
  isOpen,
  onCloseAction,
  title,
  size = "md",
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseAction();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseAction]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="admin-modal-backdrop" onMouseDown={onCloseAction}>
      <div
        ref={dialogRef}
        className={`admin-modal-container admin-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onCloseAction}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
