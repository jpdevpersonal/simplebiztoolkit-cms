import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelatedLinksEditor from "./RelatedLinksEditor";
import { clientApi } from "@/lib/clientApi";
import {
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  RELATED_LINKS_DEFAULT_TITLE,
  type RelatedLinkItem,
  type RelatedLinksBlockData,
} from "@/lib/relatedLinks";

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    getMenuItemPages: vi.fn(),
    getProductCategories: vi.fn(),
  },
}));

vi.mock("@/components/RelatedLinksBlock", () => ({
  __esModule: true,
  default: ({
    title,
    items,
    variant,
    imageSize,
  }: {
    title: string;
    items: Array<{ destinationTitle: string }>;
    variant: string;
    imageSize?: string;
  }) => (
    <div data-testid="related-links-preview">
      {`${variant}:${title}:${imageSize || "small"}:${items.map((item) => item.destinationTitle).join("|")}`}
    </div>
  ),
}));

vi.mock("@/components/CmsImagePicker", () => ({
  __esModule: true,
  default: ({
    label,
    onChangeAction,
    disabled,
    modalAdditionalContent,
  }: {
    label: string;
    onChangeAction?: (image: {
      id: string;
      url: string;
      altText: string;
    }) => void;
    disabled?: boolean;
    modalAdditionalContent?: React.ReactNode;
  }) => (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onChangeAction?.({
            id: `${label.replace(/\s+/g, "-")}-id`,
            url: `/images/${label.replace(/\s+/g, "-")}.webp`,
            altText: `${label} alt`,
          })
        }
      >
        {`Pick ${label}`}
      </button>
      {modalAdditionalContent}
    </div>
  ),
}));

function makeItem(overrides: Partial<RelatedLinkItem> = {}): RelatedLinkItem {
  return {
    uid: overrides.uid ?? "item-1",
    kind: overrides.kind ?? "page",
    refId: overrides.refId ?? "",
    href: overrides.href ?? "",
    destinationTitle: overrides.destinationTitle ?? "",
    label: overrides.label ?? null,
    imageId: overrides.imageId ?? null,
    imageUrl: overrides.imageUrl ?? null,
    imageAlt: overrides.imageAlt ?? null,
    imagePositionY: overrides.imagePositionY ?? 50,
  };
}

function getLastChange(spy: ReturnType<typeof vi.fn>): RelatedLinksBlockData {
  const lastCall = spy.mock.calls.at(-1)?.[0];
  if (!lastCall) {
    throw new Error("Expected RelatedLinksEditor to call onChange.");
  }

  return lastCall as RelatedLinksBlockData;
}

function renderControlledEditor(
  initialValue: Partial<RelatedLinksBlockData>,
  props: Partial<React.ComponentProps<typeof RelatedLinksEditor>> = {},
) {
  const onChange = vi.fn();

  function Harness() {
    const [value, setValue] = useState(initialValue);

    return (
      <RelatedLinksEditor
        value={value}
        onChange={(nextValue) => {
          onChange(nextValue);
          setValue(nextValue);
        }}
        {...props}
      />
    );
  }

  render(<Harness />);

  return {
    onChange,
    user: userEvent.setup(),
  };
}

describe("RelatedLinksEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientApi.getMenuItemPages).mockResolvedValue([
      {
        id: "page-1",
        slug: "guide-a",
        title: "Guide A",
        status: "published",
      },
      {
        id: "page-draft",
        slug: "draft-guide",
        title: "Draft Guide",
        status: "draft",
      },
    ] as never);
    vi.mocked(clientApi.getProductCategories).mockResolvedValue([
      {
        id: "cat-1",
        slug: "finance",
        name: "Finance",
        summary: "",
        howThisHelps: "",
        heroImage: "",
        items: [
          {
            id: "tpl-1",
            slug: "budget-sheet",
            title: "Budget Sheet",
            status: "published",
          },
          {
            id: "tpl-draft",
            slug: "draft-sheet",
            title: "Draft Sheet",
            status: "draft",
          },
        ],
      },
    ] as never);
  });

  it("loads published destinations and updates a page link selection", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [makeItem()],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalledWith(
        undefined,
        "published",
      );
    });

    expect(screen.getByRole("option", { name: "Guide A" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Draft Guide" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Choose page"),
      "page:page-1",
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    expect(getLastChange(onChange)).toMatchObject({
      title: RELATED_LINKS_DEFAULT_TITLE,
      backgroundColor: RELATED_LINKS_DEFAULT_BACKGROUND,
      borderWidth: RELATED_LINKS_DEFAULT_BORDER_WIDTH,
      items: [
        expect.objectContaining({
          uid: "item-1",
          kind: "page",
          refId: "page-1",
          href: "/guide-a",
          destinationTitle: "Guide A",
        }),
      ],
    });
    expect(screen.getByText("Page: /guide-a")).toBeInTheDocument();
  });

  it("clears stale page selection when switching to template and applies the selected template route", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [
        makeItem({
          refId: "page-1",
          href: "/guide-a",
          destinationTitle: "Guide A",
          label: "Custom label",
        }),
      ],
    });

    await waitFor(() => {
      expect(clientApi.getProductCategories).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Template" }));

    expect(getLastChange(onChange).items[0]).toMatchObject({
      kind: "template",
      refId: "",
      href: "",
      destinationTitle: "",
      label: "Custom label",
    });

    await user.selectOptions(
      screen.getByLabelText("Choose template"),
      "template:tpl-1",
    );

    expect(getLastChange(onChange).items[0]).toMatchObject({
      kind: "template",
      refId: "tpl-1",
      href: "/templates/finance/budget-sheet",
      destinationTitle: "Budget Sheet",
      label: "Custom label",
    });
    expect(
      screen.getByText("Template: /templates/finance/budget-sheet"),
    ).toBeInTheDocument();
  });

  it("supports custom URL links entered through the add link form", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [makeItem()],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Custom URL" }));

    expect(getLastChange(onChange).items[0]).toMatchObject({
      kind: "custom",
      refId: "",
      href: "",
      destinationTitle: "",
    });

    const urlInput = screen.getByLabelText("Custom URL");
    fireEvent.change(urlInput, {
      target: { value: "https://example.com/resources" },
    });

    await waitFor(() => {
      expect(getLastChange(onChange).items[0]).toMatchObject({
        kind: "custom",
        refId: "",
        href: "https://example.com/resources",
        destinationTitle: "https://example.com/resources",
      });
    });

    expect(screen.getByText("Ready")).toBeInTheDocument();

    const labelInput = screen.getByLabelText("Visible label");
    fireEvent.change(labelInput, { target: { value: "Example resources" } });

    await waitFor(() => {
      expect(getLastChange(onChange).items[0]).toMatchObject({
        href: "https://example.com/resources",
        label: "Example resources",
      });
    });

    expect(screen.getByTestId("related-links-preview")).toHaveTextContent(
      "https://example.com/resources",
    );
  });

  it("flags invalid custom URLs as incomplete", async () => {
    const { onChange } = renderControlledEditor({
      items: [makeItem({ kind: "custom" })],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    expect(screen.getByText("Enter a URL")).toBeInTheDocument();

    const urlInput = screen.getByLabelText("Custom URL");
    fireEvent.change(urlInput, { target: { value: "javascript:alert(1)" } });

    await waitFor(() => {
      expect(getLastChange(onChange).items[0]).toMatchObject({
        href: "javascript:alert(1)",
      });
    });

    expect(screen.getByText("Enter a URL")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter a URL like example.com, https://example.com, or an internal path starting with /.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the visible label blank by default and allows spaces while typing", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [
        makeItem({
          refId: "page-1",
          href: "/guide-a",
          destinationTitle: "Guide A",
        }),
      ],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    const labelInput = screen.getByLabelText("Visible label");
    expect(labelInput).toHaveValue("");
    expect(labelInput).not.toHaveAttribute("placeholder");

    await user.type(labelInput, "Custom CTA Label");

    await waitFor(() => {
      expect(getLastChange(onChange).items[0]).toMatchObject({
        label: "Custom CTA Label",
      });
    });

    expect(labelInput).toHaveValue("Custom CTA Label");
    expect(screen.getByText(/Shown as:/)).toHaveTextContent(
      "Shown as: Custom CTA Label",
    );

    await user.click(screen.getByRole("button", { name: "Pick link 1 image" }));

    expect(getLastChange(onChange).items[0]).toMatchObject({
      label: "Custom CTA Label",
      imageId: "link-1-image-id",
      imageUrl: "/images/link-1-image.webp",
      imageAlt: "link 1 image alt",
    });
  });

  it("shows load errors and still allows adding a manual item afterwards", async () => {
    vi.mocked(clientApi.getMenuItemPages).mockRejectedValueOnce(
      new Error("Unable to load destinations."),
    );

    const { user, onChange } = renderControlledEditor({ items: [] });

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load destinations."),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Start with one link\. You can reorder them any time/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add link" }));

    expect(getLastChange(onChange)).toMatchObject({
      items: [
        expect.objectContaining({
          kind: "page",
          refId: "",
          href: "",
          destinationTitle: "",
        }),
      ],
    });
    expect(screen.getByText("Link 1")).toBeInTheDocument();
  });

  it("reorders items and removes the selected entry", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [
        makeItem({ uid: "item-1", destinationTitle: "Guide A" }),
        makeItem({ uid: "item-2", destinationTitle: "Guide B" }),
      ],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    await user.click(screen.getAllByRole("button", { name: "Down" })[0]);

    expect(getLastChange(onChange).items.map((item) => item.uid)).toEqual([
      "item-2",
      "item-1",
    ]);

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(getLastChange(onChange).items.map((item) => item.uid)).toEqual([
      "item-1",
    ]);
  });

  it("updates the image size setting and reflects it in preview", async () => {
    const { user, onChange } = renderControlledEditor({
      items: [
        makeItem({
          refId: "page-1",
          href: "/guide-a",
          destinationTitle: "Guide A",
          imageUrl: "/images/guide-a.webp",
        }),
      ],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    await user.selectOptions(screen.getByLabelText("Image size"), "large");

    expect(getLastChange(onChange)).toMatchObject({
      imageSize: "large",
    });
    expect(screen.getByTestId("related-links-preview")).toHaveTextContent(
      "content:Related to this:large:Guide A",
    );
  });

  it("updates thumbnail framing so the crop can be pushed to the top", async () => {
    const { onChange } = renderControlledEditor({
      items: [
        makeItem({
          refId: "page-1",
          href: "/guide-a",
          destinationTitle: "Guide A",
          imageUrl: "/images/guide-a.webp",
        }),
      ],
    });

    await waitFor(() => {
      expect(clientApi.getMenuItemPages).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Vertical position"), {
      target: { value: "0" },
    });

    expect(getLastChange(onChange).items[0]).toMatchObject({
      imagePositionY: 0,
    });
  });
});
