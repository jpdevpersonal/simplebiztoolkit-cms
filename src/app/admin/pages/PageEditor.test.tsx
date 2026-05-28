import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PageEditor from "./PageEditor";
import { clientApi } from "@/lib/clientApi";
import { serializeRelatedLinksBlockToHtml } from "@/lib/relatedLinks";

const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
      refresh: routerRefresh,
    }),
  };
});

vi.mock("@/components/RichContentField", () => ({
  __esModule: true,
  default: ({
    label,
    value,
    storageKey,
  }: {
    label: string;
    value?: string;
    storageKey?: string;
  }) => (
    <div data-testid={`rich-content-${storageKey}`}>
      {label || value || "rich-content"}
    </div>
  ),
}));

vi.mock("@/components/RelatedLinksEditor", () => ({
  __esModule: true,
  default: ({ value }: { value?: { items?: unknown[] } }) => (
    <div data-testid="related-links-editor">
      {(value?.items ?? []).length} related link(s)
    </div>
  ),
}));

vi.mock("@/components/AdminModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onCloseAction,
    title,
    children,
  }: {
    isOpen: boolean;
    onCloseAction: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="admin-modal" data-title={title}>
        <button type="button" onClick={onCloseAction} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/CmsImagePicker", () => ({
  __esModule: true,
  default: ({
    label,
    onChangeAction,
  }: {
    label: string;
    onChangeAction?: (image: any) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChangeAction?.(
          label === "featured image"
            ? {
                id: "img-featured",
                url: "https://simplebiztoolkitblobtest.blob.core.windows.net/images/featured.webp",
                blobName: "featured.webp",
              }
            : {
                id: "img-header",
                url: "https://simplebiztoolkitblobtest.blob.core.windows.net/images/header.webp",
                blobName: "header.webp",
              },
        )
      }
    >
      {`Pick ${label}`}
    </button>
  ),
}));

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    getMenuCategories: vi.fn().mockResolvedValue([]),
    updateMenuItemPage: vi.fn(),
    createMenuItemPage: vi.fn(),
    deleteMenuItemPage: vi.fn(),
  },
}));

function getInputForLabel(labelText: string) {
  const label = screen.getByText(labelText);
  const control = label.parentElement?.querySelector("input, textarea, select");

  if (
    !(
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    )
  ) {
    throw new Error(`Unable to find control for label: ${labelText}`);
  }

  return control;
}

async function waitForMenuCategoriesLoad(menuItemId = "menu-1") {
  await waitFor(() => {
    expect(clientApi.getMenuCategories).toHaveBeenCalledWith(menuItemId);
  });

  const getMenuCategoriesMock = vi.mocked(clientApi.getMenuCategories);
  const latestCallResult =
    getMenuCategoriesMock.mock.results[
      getMenuCategoriesMock.mock.results.length - 1
    ]?.value;
  await latestCallResult;
}

describe("PageEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerPush.mockReset();
    routerRefresh.mockReset();
    vi.mocked(clientApi.getMenuCategories).mockResolvedValue([] as never);
  });

  it("sends image ids and omits legacy image url fields when saving a page", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateMenuItemPage).mockResolvedValueOnce({
      slug: "page-slug",
    } as never);

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Existing Page",
            description: "Description",
            content:
              "<div>\n  <p>content</p>\n  <p><strong>more</strong></p>\n</div>",
            dateISO: "2026-03-24",
            dateModified: "2026-03-24",
            status: "draft",
            featuredImage: "https://legacy.example.com/featured.webp",
            headerImage: "https://legacy.example.com/header.webp",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    await user.click(
      screen.getByRole("button", { name: "Pick featured image" }),
    );
    await user.click(screen.getByRole("button", { name: "Pick header image" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuItemPage).toHaveBeenCalled();
    });

    const [, payload] = vi.mocked(clientApi.updateMenuItemPage).mock.calls[0];
    expect(payload).toMatchObject({
      featuredImageId: "img-featured",
      headerImageId: "img-header",
      content: "<div><p>content</p><p><strong>more</strong></p></div>",
    });
    expect(payload).not.toHaveProperty("featuredImage");
    expect(payload).not.toHaveProperty("headerImage");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("creates a page with an auto-generated slug and selected topic", async () => {
    const user = userEvent.setup();

    vi.mocked(clientApi.getMenuCategories).mockResolvedValueOnce([
      { id: "cat-1", title: "Payroll", status: "draft" } as any,
    ] as never);
    vi.mocked(clientApi.createMenuItemPage).mockResolvedValueOnce({
      slug: "new-page-title",
    } as never);

    render(
      <PageEditor
        isNew
        menuItems={[
          {
            id: "menu-1",
            title: "Guides",
            status: "draft",
            categories: [{ id: "cat-1", title: "Payroll", status: "draft" }],
          } as any,
        ]}
      />,
    );

    await user.type(getInputForLabel("Title *"), "New Page Title");
    await user.clear(getInputForLabel("Slug *"));
    await user.type(getInputForLabel("Slug *"), "new-page-title");

    const [menuItemSelect, topicSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(menuItemSelect, "menu-1");
    await waitForMenuCategoriesLoad();
    await user.selectOptions(topicSelect, "cat-1");
    await user.click(screen.getByRole("button", { name: "Create Page" }));

    await waitFor(() => {
      expect(clientApi.createMenuItemPage).toHaveBeenCalled();
    });

    expect(vi.mocked(clientApi.createMenuItemPage).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        title: "New Page Title",
        slug: "new-page-title",
        menuCategoryId: "cat-1",
        menuItemId: undefined,
      }),
    );
    expect(routerPush).toHaveBeenCalledWith("/cms/pages");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("shows an error instead of saving when no menu item is selected", async () => {
    const user = userEvent.setup();

    render(<PageEditor isNew menuItems={[]} />);

    await user.type(getInputForLabel("Title *"), "Draft page");
    await user.clear(getInputForLabel("Slug *"));
    await user.type(getInputForLabel("Slug *"), "draft-page");
    fireEvent.submit(
      screen.getByRole("button", { name: "Create Page" }).closest("form")!,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select a Menu Item.",
    );
    expect(clientApi.createMenuItemPage).not.toHaveBeenCalled();
  });

  it("shows the preview link for an existing saved draft page", async () => {
    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(screen.getByRole("link", { name: /preview/i })).toHaveAttribute(
      "href",
      "/preview/pages/page-1",
    );
  });

  it("hides the preview link for a new unsaved page", async () => {
    render(<PageEditor isNew menuItems={[]} />);

    await waitFor(() => {
      expect(clientApi.getMenuCategories).not.toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("link", { name: /preview/i }),
    ).not.toBeInTheDocument();
  });

  it("collapses and expands page sections", async () => {
    const user = userEvent.setup();

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(screen.getByText("Title *")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Collapse Page Content" }),
    );

    expect(screen.queryByText("Title *")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Expand Page Content" }),
    );

    expect(screen.getByText("Title *")).toBeInTheDocument();
  });

  it("reads showLastUpdated from the page and persists it via the save payload", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateMenuItemPage).mockResolvedValueOnce({
      slug: "page-slug",
    } as never);

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Existing Page",
            status: "draft",
            showLastUpdated: true,
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    const checkbox = screen.getByRole("checkbox", {
      name: /Show .*Last updated.* date/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuItemPage).toHaveBeenCalled();
    });

    const [, payload] = vi.mocked(clientApi.updateMenuItemPage).mock.calls[0];
    expect(payload).toMatchObject({ showLastUpdated: false });
  });

  it("defaults showLastUpdated to true when the page does not provide it", async () => {
    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Existing Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(
      screen.getByRole("checkbox", {
        name: /Show .*Last updated.* date/i,
      }),
    ).toBeChecked();
  });

  it("tracks sidebar collapse state classes without hiding the sidebar", async () => {
    const user = userEvent.setup();

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    const layout = screen.getByTestId("page-editor-layout");

    expect(layout.className).toContain("page-editor-layout");
    expect(layout.className).not.toContain(
      "page-editor-layout--sidebar-relaxed",
    );

    await user.click(
      screen.getByRole("button", { name: "Collapse Assignment" }),
    );
    expect(layout.className).toContain("page-editor-layout--sidebar-relaxed");

    await user.click(screen.getByRole("button", { name: "Collapse Publish" }));
    expect(layout.className).toContain("page-editor-layout--sidebar-compact");
  });

  it("keeps collapsed sidebar sections visible so they can be expanded again", async () => {
    const user = userEvent.setup();

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    await user.click(
      screen.getByRole("button", { name: "Collapse Assignment" }),
    );
    await user.click(screen.getByRole("button", { name: "Collapse Publish" }));

    expect(
      screen.getByRole("button", { name: "Expand Assignment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Expand Publish" }),
    ).toBeInTheDocument();
  });

  it("renders SEO in the main column before the content editor", async () => {
    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    const seoToggle = screen.getByRole("button", { name: "Collapse SEO" });
    const contentToggle = screen.getByRole("button", {
      name: "Collapse Content",
    });

    expect(
      seoToggle.compareDocumentPosition(contentToggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the content editor in its own full-width row", async () => {
    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "draft-page",
            title: "Draft Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    const contentRow = screen.getByTestId("page-editor-content-row");
    const contentToggle = screen.getByRole("button", {
      name: "Collapse Content",
    });

    expect(contentRow).toContainElement(contentToggle);
  });

  it("renders a dedicated related links section and keeps it out of the content editor", async () => {
    const relatedLinksHtml = serializeRelatedLinksBlockToHtml({
      title: "Related to this",
      items: [
        {
          uid: "link-1",
          kind: "page",
          refId: "page-1",
          href: "/bookkeeping-guide",
          destinationTitle: "Bookkeeping guide",
          label: null,
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
    });

    vi.mocked(clientApi.updateMenuItemPage).mockResolvedValueOnce({
      slug: "page-slug",
    } as never);

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Existing Page",
            description: "Description",
            content: `<p>Main body</p>\n${relatedLinksHtml}`,
            dateISO: "2026-03-24",
            dateModified: "2026-03-24",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(screen.getByText("Related Links")).toBeInTheDocument();
    expect(screen.getByTestId("related-links-editor")).toHaveTextContent(
      "1 related link(s)",
    );
    expect(
      screen.getByTestId("rich-content-page-content-mode"),
    ).toHaveTextContent("<p>Main body</p>");
    expect(
      screen.getByTestId("rich-content-page-content-mode"),
    ).not.toHaveTextContent('data-sbt-block="related-links"');

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuItemPage).toHaveBeenCalled();
    });

    const [, payload] = vi.mocked(clientApi.updateMenuItemPage).mock.calls[0];
    expect(payload).toMatchObject({
      content: expect.stringContaining("<p>Main body</p>"),
    });
    expect((payload as { content?: string }).content).toContain(
      'data-sbt-block="related-links"',
    );
  });

  it("shows a delete error when removing an existing page fails", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.mocked(clientApi.deleteMenuItemPage).mockRejectedValueOnce(
      new Error("Delete failed"),
    );

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "existing-page",
            title: "Existing Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    await user.click(screen.getByRole("button", { name: "Delete Page" }));

    await waitFor(() => {
      expect(clientApi.deleteMenuItemPage).toHaveBeenCalledWith("page-1");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Delete failed");
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("renders a pop-out button in the Content section header", async () => {
    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(
      screen.getByRole("button", {
        name: "Open content editor in full screen",
      }),
    ).toBeInTheDocument();
  });

  it("opens the content editor modal when the pop-out button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    expect(screen.queryByTestId("admin-modal")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Open content editor in full screen",
      }),
    );

    expect(screen.getByTestId("admin-modal")).toBeInTheDocument();
    expect(screen.getByTestId("admin-modal")).toHaveAttribute(
      "data-title",
      "Content Editor",
    );
  });

  it("closes the content editor modal when close is clicked", async () => {
    const user = userEvent.setup();

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Page",
            status: "draft",
          } as any
        }
        menuItems={[{ id: "menu-1", title: "Menu", status: "draft" } as any]}
      />,
    );

    await waitForMenuCategoriesLoad();

    await user.click(
      screen.getByRole("button", {
        name: "Open content editor in full screen",
      }),
    );
    expect(screen.getByTestId("admin-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByTestId("admin-modal")).not.toBeInTheDocument();
  });
});
