/**
 * Edit Page – Admin
 * Loads the page and all menu items for the PageEditor component.
 */

import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import PageEditor from "../../PageEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPageAdminPage({ params }: Props) {
  const { id } = await params;
  const { service } = await getAdminApiService();

  const [pageRes, menuRes] = await Promise.all([
    service.getMenuItemPageById(id),
    service.getMenuItems(),
  ]);

  if (!pageRes.data) return notFound();

  const page = pageRes.data;
  const menuItems = menuRes.data || [];
  const breadcrumbItems = [{ href: "/cms/pages", label: "Pages" }];

  // Resolve menu item id (might come via category)
  let menuItemId = page.menuItemId;
  if (!menuItemId && page.menuCategoryId) {
    const catRes = await service.getMenuCategoryById(page.menuCategoryId);
    menuItemId = catRes.data?.menuItemId;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Edit Page</h1>
        </div>
        <span className="admin-page-meta">ID: {id}</span>
      </div>
      <PageEditor
        page={page}
        menuItems={menuItems}
        initialMenuItemId={menuItemId}
        initialCategoryId={page.menuCategoryId}
      />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
