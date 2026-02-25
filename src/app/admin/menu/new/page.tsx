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
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--sb-muted)",
              marginBottom: "0.25rem",
            }}
          >
            <Link
              href="/admin/menu"
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
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
