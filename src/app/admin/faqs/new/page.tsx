/**
 * New FAQ Page
 */

import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import FaqEditor from "@/components/FaqEditor";

export default function NewFaqPage() {
  const breadcrumbItems = [{ href: "/cms/faqs", label: "FAQs" }];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New FAQ</h1>
        </div>
      </div>
      <FaqEditor />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
