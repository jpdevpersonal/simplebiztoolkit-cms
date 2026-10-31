"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RefreshCw, TriangleAlert } from "lucide-react";

type Status = "idle" | "working" | "done" | "error";

const LABELS: Record<Status, string> = {
  idle: "Refresh live site",
  working: "Refreshing…",
  done: "Live site refreshed",
  error: "Refresh failed – retry",
};

/**
 * Clears the public site's cache so recent CMS edits show immediately.
 * Safe to click at any time: pages are simply rebuilt on their next visit.
 */
export default function AdminRevalidateButton({
  className = "admin-nav-logout",
}: {
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const handleClick = async () => {
    window.clearTimeout(resetTimer.current);
    setStatus("working");
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
    resetTimer.current = window.setTimeout(() => setStatus("idle"), 4000);
  };

  const Icon =
    status === "done" ? Check : status === "error" ? TriangleAlert : RefreshCw;

  return (
    <>
      <button
        type="button"
        className={`${className} admin-revalidate-btn is-${status}`}
        onClick={handleClick}
        disabled={status === "working"}
        title="Clear the site cache so your latest changes appear on the live site straight away"
      >
        <Icon
          size={16}
          aria-hidden="true"
          className={status === "working" ? "admin-spin" : undefined}
        />
        <span>{LABELS[status]}</span>
      </button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {status === "idle" ? "" : LABELS[status]}
      </span>
    </>
  );
}
