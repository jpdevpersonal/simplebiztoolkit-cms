/**
 * PreserveAttributes
 *
 * Tiptap extension that round-trips `style` and `class` attributes through
 * the editor for common block & inline types. Without this, switching from
 * the HTML editor to Tiptap would strip inline CSS off paragraphs, headings,
 * lists, images, etc. because Tiptap's default schema does not recognise
 * those attributes.
 *
 * We deliberately *do not* add new node types (e.g. arbitrary `<div>` or
 * `<span>`) — that would be a much bigger schema change. Instead we keep
 * styles attached to the existing nodes so the round-trip is lossless for
 * the most common CMS authoring patterns.
 */

import { Extension } from "@tiptap/core";

const TARGET_TYPES = [
  "heading",
  "paragraph",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "image",
  "imageBlock",
  "codeBlock",
  "horizontalRule",
];

export const PreserveAttributes = Extension.create({
  name: "preserveAttributes",

  addGlobalAttributes() {
    return [
      {
        types: TARGET_TYPES,
        attributes: {
          style: {
            default: null,
            parseHTML: (element) => element.getAttribute("style"),
            renderHTML: (attributes) => {
              const style = (attributes as { style?: string | null }).style;
              return style ? { style } : {};
            },
          },
          class: {
            default: null,
            parseHTML: (element) => element.getAttribute("class"),
            renderHTML: (attributes) => {
              const className = (attributes as { class?: string | null }).class;
              return className ? { class: className } : {};
            },
          },
        },
      },
    ];
  },
});

export default PreserveAttributes;
