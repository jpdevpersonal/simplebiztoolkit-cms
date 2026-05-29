"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Faq, FaqInput } from "@/lib/api";
import { redirectAndRefresh } from "@/lib/adminNavigation";
import { clientApi } from "@/lib/clientApi";
import RichContentField from "@/components/RichContentField";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

type FaqEditorProps = {
  faq?: Faq;
};

const EMPTY_FAQ: Faq = {
  id: "",
  q: "",
  a: "",
  group: "",
  sortOrder: 0,
  status: "draft",
};

const FAQS_LIST_PATH = "/cms/faqs";

export default function FaqEditor({ faq }: FaqEditorProps) {
  const faqData = faq || EMPTY_FAQ;
  const isCreateMode = !faqData.id;
  const router = useRouter();

  const [question, setQuestion] = useState(faqData.q || "");
  const [answer, setAnswer] = useState(faqData.a || "");
  const [group, setGroup] = useState(faqData.group || "");
  const [sortOrder, setSortOrder] = useState<number>(faqData.sortOrder ?? 0);
  const [status, setStatus] = useState<"draft" | "published">(
    faqData.status || "draft",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveFaq() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload: FaqInput = {
        q: question.trim(),
        a: answer,
        group: group.trim() || undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        status,
      };

      if (isCreateMode) {
        await clientApi.createFaq(payload);
      } else {
        await clientApi.updateFaq(faqData.id, payload);
      }

      redirectAndRefresh(router, FAQS_LIST_PATH);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveFaq();
  }

  async function handleDelete() {
    if (isCreateMode) return;
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteFaq(faqData.id);
      setMessage("FAQ deleted!");
      redirectAndRefresh(router, FAQS_LIST_PATH);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminFormBlock
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1.2-1.5 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
        }
        title="FAQ Details"
      >
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">Question *</label>
            <input
              className="form-control"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={500}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Group</label>
            <input
              className="form-control"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="e.g. Getting started"
              maxLength={200}
            />
            <div className="form-text">
              Free-text grouping label. Items with the same group label are
              shown together.
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Sort Order</label>
            <input
              type="number"
              className="form-control"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              min={0}
              step={1}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </AdminFormBlock>

      <AdminFormBlock
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Answer"
      >
        <div className="row g-3">
          <div className="col-12">
            <RichContentField
              label="Answer *"
              value={answer}
              onChange={setAnswer}
              storageKey="faq-answer-editor-mode"
              htmlRows={6}
              minHeight={200}
              placeholder="Write the FAQ answer…"
              onSave={saveFaq}
              required
            />
          </div>
        </div>
      </AdminFormBlock>

      <EditorActions
        saving={saving}
        isCreateMode={isCreateMode}
        entityName="FAQ"
        onCancel={() => redirectAndRefresh(router, FAQS_LIST_PATH)}
        onDelete={isCreateMode ? undefined : handleDelete}
        deleting={deleting}
      />

      <EditorFeedback message={message} error={error} />
    </form>
  );
}
