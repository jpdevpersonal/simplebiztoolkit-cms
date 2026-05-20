"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type AdminModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => !element.hasAttribute("hidden"));
}

export default function AdminModal({
  isOpen,
  onCloseAction,
  title,
  size = "md",
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
      previouslyFocusedRef.current?.focus({ preventScroll: true });
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseAction();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const currentFocus = document.activeElement;

      if (event.shiftKey) {
        if (currentFocus === firstFocusable || !dialog.contains(currentFocus)) {
          event.preventDefault();
          lastFocusable.focus({ preventScroll: true });
        }
        return;
      }

      if (currentFocus === lastFocusable || !dialog.contains(currentFocus)) {
        event.preventDefault();
        firstFocusable.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseAction]);

  useEffect(() => {
    if (isOpen) {
      const dialog = dialogRef.current;
      const firstFocusable = dialog ? getFocusableElements(dialog)[0] : null;
      (firstFocusable ?? dialog)?.focus({ preventScroll: true });
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
