/**
 * New Category Page
 */

import Link from "next/link";
import CategoryEditor from "@/components/CategoryEditor";

export default function NewCategoryPage() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--sb-muted)",
              marginBottom: "0.25rem",
            }}
          >
            <Link
              href="/admin/categories"
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              ← Categories
            </Link>
          </div>
          <h1>New Category</h1>
        </div>
      </div>
      <CategoryEditor isNew />
    </div>
  );
}
