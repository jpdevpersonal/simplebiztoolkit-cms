import { Node, mergeAttributes } from "@tiptap/core";

function parseBooleanAttribute(value?: string | null): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

/**
 * Backward-compat with older article content that used:
 * <section data-component="article-cta" ...data-* />
 */
export const LegacyArticleCtaBlock = Node.create({
  name: "ctaBlock",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "section[data-component='article-cta']" }];
  },

  addAttributes() {
    return {
      title: {
        default: "Ready to get started?",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-title"),
        renderHTML: (attrs: { title?: string }) =>
          attrs.title ? { "data-title": attrs.title } : {},
      },
      description: {
        default: "Add a short supporting description.",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-description"),
        renderHTML: (attrs: { description?: string }) =>
          attrs.description ? { "data-description": attrs.description } : {},
      },
      primaryLabel: {
        default: "Explore",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-primary-label"),
        renderHTML: (attrs: { primaryLabel?: string }) =>
          attrs.primaryLabel
            ? { "data-primary-label": attrs.primaryLabel }
            : {},
      },
      primaryHref: {
        default: "https://example.com",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-primary-href"),
        renderHTML: (attrs: { primaryHref?: string }) =>
          attrs.primaryHref ? { "data-primary-href": attrs.primaryHref } : {},
      },
      disclosure: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-disclosure"),
        renderHTML: (attrs: { disclosure?: string | null }) =>
          attrs.disclosure ? { "data-disclosure": attrs.disclosure } : {},
      },
      showHomeLink: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          parseBooleanAttribute(el.getAttribute("data-show-home-link")),
        renderHTML: (attrs: { showHomeLink?: boolean }) => ({
          "data-show-home-link": attrs.showHomeLink ? "true" : "false",
        }),
      },
      showEtsyLink: {
        default: false,
        parseHTML: (el: HTMLElement) =>
          parseBooleanAttribute(el.getAttribute("data-show-etsy-link")),
        renderHTML: (attrs: { showEtsyLink?: boolean }) => ({
          "data-show-etsy-link": attrs.showEtsyLink ? "true" : "false",
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-component": "article-cta",
      }),
    ];
  },
});
