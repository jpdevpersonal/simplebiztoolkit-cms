import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PageEditor from "./PageEditor";
import { clientApi } from "@/lib/clientApi";

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
  default: ({ label }: { label: string }) => <div>{label}</div>,
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
    revalidateContent: vi.fn(),
  },
}));

describe("PageEditor", () => {
  it("sends image ids and omits legacy image url fields when saving a page", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateMenuItemPage).mockResolvedValueOnce({
      slug: "page-slug",
    } as never);
    vi.mocked(clientApi.revalidateContent).mockResolvedValueOnce(
      undefined as never,
    );

    render(
      <PageEditor
        page={
          {
            id: "page-1",
            menuItemId: "menu-1",
            slug: "page-slug",
            title: "Existing Page",
            description: "Description",
            content: "<p>content</p>",
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
    });
    expect(payload).not.toHaveProperty("featuredImage");
    expect(payload).not.toHaveProperty("headerImage");
    expect(clientApi.revalidateContent).toHaveBeenCalledWith(
      "page",
      "page-slug",
      "page-slug",
    );
    expect(routerRefresh).toHaveBeenCalled();
  });
});
