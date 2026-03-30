import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import { ContentRenderer } from "@/components/ContentRenderer";
import { slugify } from "@/lib/slugify";
import "@/styles/contentPage.css";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Page Preview | Simple Biz Toolkit",
  robots: "noindex, nofollow",
};

export default async function PagePreview({ params }: Props) {
  const { id } = await params;
  const { service, session } = await getAdminApiService();

  if (!session) {
    redirect("/admin/login");
  }

  const pageResponse = await service.getMenuItemPageById(id);
  if (!pageResponse.data) {
    notFound();
  }

  const page = pageResponse.data;

  let parentMenuItem = page.menuItem ?? page.menuCategory?.menuItem;
  if (!parentMenuItem && page.menuItemId) {
    const menuItemResponse = await service.getMenuItemById(page.menuItemId);
    parentMenuItem = menuItemResponse.data;
  }
  if (!parentMenuItem && page.menuCategoryId) {
    const categoryResponse = await service.getMenuCategoryById(
      page.menuCategoryId,
    );
    if (categoryResponse.data?.menuItemId) {
      const menuItemResponse = await service.getMenuItemById(
        categoryResponse.data.menuItemId,
      );
      parentMenuItem = menuItemResponse.data;
    }
  }

  return (
    <>
      <section className="container pt-4">
        <div className="alert alert-warning mb-0" role="status">
          Previewing saved {page.status ?? "draft"} page.
        </div>
      </section>

      <main className="content-page">
        {parentMenuItem ? (
          <nav className="sb-breadcrumb" aria-label="Breadcrumb">
            <Link
              href={`/pages/${slugify(parentMenuItem.title)}`}
              className="sb-breadcrumb-link"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="sb-breadcrumb-icon"
              >
                <path
                  d="M10 3l-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to {parentMenuItem.title}
            </Link>
          </nav>
        ) : null}

        <header className="content-header" />

        {page.headerImage && (
          <div className="content-header-image">
            <Image
              src={page.headerImage}
              alt={page.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="lazy"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}

        <article>
          <ContentRenderer html={page.content ?? ""} />
        </article>
      </main>
    </>
  );
}
