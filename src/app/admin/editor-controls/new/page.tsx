/**
 * New Editor Control Page - Admin
 */

import Link from "next/link";
import EditorControlEditor from "@/app/admin/editor-controls/EditorControlEditor";

export default function NewEditorControlPage() {
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
          <h1>New Editor Control</h1>
        </div>
      </div>
      <EditorControlEditor isNew />
    </div>
  );
}
