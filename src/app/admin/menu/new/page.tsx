/**
 * New Menu Item Page - Admin
 */

import Link from "next/link";
import MenuItemEditor from "@/components/MenuItemEditor";

export default function NewMenuItemPage() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/menu" className="admin-breadcrumb-link">
              ← Menu Items
            </Link>
          </div>
          <h1>New Menu Item</h1>
        </div>
      </div>
      <MenuItemEditor isNew />
    </div>
  );
}
