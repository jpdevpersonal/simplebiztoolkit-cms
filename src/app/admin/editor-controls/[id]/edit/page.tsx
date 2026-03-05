/**
 * Edit Editor Control Page - Admin
 * Fetches the control by id via clientApi on the client side.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { EditorControlPreset } from "@/types/editorControls";
import { clientApi } from "@/lib/clientApi";
import EditorControlEditor from "@/app/admin/editor-controls/EditorControlEditor";

export default function EditEditorControlPage() {
  const { id } = useParams<{ id: string }>();
  const [control, setControl] = useState<EditorControlPreset | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    clientApi
      .getEditorControlById(id)
      .then(setControl)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Not Found</h1>
        </div>
        <p>Editor control not found.</p>
        <Link href="/admin/editor-controls">← Back to Editor Controls</Link>
      </div>
    );
  }

  if (!control) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Loading…</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link
              href="/admin/editor-controls"
              className="admin-breadcrumb-link"
            >
              ← Editor Controls
            </Link>
          </div>
          <h1>Edit: {control.name}</h1>
        </div>
      </div>
      <EditorControlEditor control={control} />
    </div>
  );
}
