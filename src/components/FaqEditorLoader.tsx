"use client";

import React, { useEffect, useState } from "react";
import FaqEditor from "@/components/FaqEditor";
import type { Faq } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";

type Props = { id: string };

export default function FaqEditorLoader({ id }: Props) {
  const [faq, setFaq] = useState<Faq | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const payload = await clientApi.getFaqById(id);
        if (!mounted) return;
        setFaq(payload || null);
      } catch (err) {
        if (!mounted) return;
        setFaq(null);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load FAQ. Please try again.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id, reloadKey]);

  if (loading) return <div className="sb-card p-3">Loading FAQ…</div>;

  if (error) {
    return (
      <div className="sb-card p-3" role="alert">
        <div className="admin-feedback admin-feedback-error">{error}</div>
        <button
          type="button"
          className="admin-btn-action"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!faq) return <div className="sb-card p-3">FAQ not found.</div>;

  return <FaqEditor faq={faq} />;
}
