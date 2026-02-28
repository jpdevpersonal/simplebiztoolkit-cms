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
          <div className="admin-breadcrumb">
            <Link href="/admin/categories" className="admin-breadcrumb-link">
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
