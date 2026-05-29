"use client";

import React from "react";
import { CMS_LOGIN_PATH, toCmsPath } from "@/lib/adminRoutes";

type EditorFeedbackProps = {
  /** Success message to display (null/undefined = hidden) */
  message?: string | null;
  /** Error message to display (null/undefined = hidden) */
  error?: string | null;
};

/** Heuristic: an expired/invalid session message should offer a re-auth link. */
function isSessionExpiredError(error?: string | null): boolean {
  if (!error) return false;
  return /session has expired|sign in again/i.test(error);
}

/**
 * Shared success / error feedback banners for admin content editors.
 * Renders nothing when both props are absent or falsy.
 *
 * On a new message or error the banner scrolls itself into view so feedback
 * is never missed when the action button sits at the bottom of a long form.
 * When the error indicates an expired session, a "Sign in again" link is
 * shown that opens login in a new tab so unsaved work in this tab is kept.
 */
export default function EditorFeedback({
  message,
  error,
}: EditorFeedbackProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sessionExpired = isSessionExpiredError(error);

  React.useEffect(() => {
    const node = containerRef.current;
    if (
      (message || error) &&
      node &&
      typeof node.scrollIntoView === "function"
    ) {
      node.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [message, error]);

  const reauthHref = React.useMemo(() => {
    if (!sessionExpired || typeof window === "undefined") return null;
    const callbackUrl = toCmsPath(
      `${window.location.pathname}${window.location.search}`,
    );
    return `${CMS_LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }, [sessionExpired]);

  if (!message && !error) return null;

  return (
    <div ref={containerRef}>
      {message && (
        <div className="admin-feedback admin-feedback-success">{message}</div>
      )}
      {error && (
        <div role="alert" className="admin-feedback admin-feedback-error">
          <span>{error}</span>
          {reauthHref && (
            <>
              {" "}
              <a
                href={reauthHref}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-feedback-link"
              >
                Sign in again
              </a>{" "}
              in a new tab, then return here and save again to keep your
              changes.
            </>
          )}
        </div>
      )}
    </div>
  );
}
