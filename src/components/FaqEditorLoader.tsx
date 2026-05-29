"use client";

import React, { useEffect, useState } from "react";
import FaqEditor from "@/components/FaqEditor";
import type { Faq } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";

type Props = { id: string };

export default function FaqEditorLoader({ id }: Props) {
  const [faq, setFaq] = useState<Faq | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const payload = await clientApi.getFaqById(id);
        if (!mounted) return;
        setFaq(payload || null);
      } catch {
        // ignore — handled below by null state
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!faq) return <div className="sb-card p-3">FAQ not found.</div>;

  return <FaqEditor faq={faq} />;
}
