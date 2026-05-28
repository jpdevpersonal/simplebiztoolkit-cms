/**
 * Edit FAQ Page
 */

import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import FaqEditorLoader from "@/components/FaqEditorLoader";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditFaqPage({ params }: Props) {
  const { id } = await params;
  const breadcrumbItems = [{ href: "/cms/faqs", label: "FAQs" }];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Edit FAQ</h1>
        </div>
        <span className="admin-page-meta">ID: {id}</span>
      </div>
      <FaqEditorLoader id={id} />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
