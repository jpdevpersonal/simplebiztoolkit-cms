/**
 * StyleBlock
 *
 * Tiptap node extension that preserves top-level `<style>` blocks when
 * authors switch from the HTML source editor to the rich-text view.
 *
 * The CSS itself is stored as a single attribute and rendered back into
 * the document as a `<style>` element on export, so the round-trip
 * (HTML → Tiptap → HTML) is lossless. Inside the editor it is shown as a
 * collapsed, selectable badge — clicking the badge opens a small inline
 * textarea so the rules can still be edited without leaving Tiptap.
 *
 * Because the rendered output is a real `<style>` element, the browser
 * applies the rules to the rest of the editor content as well, giving
 * authors a live preview of their CSS while editing.
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState } from "react";

interface StyleBlockAttrs {
  css: string;
}

function StyleBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const css = (node.attrs as StyleBlockAttrs).css ?? "";
  const [open, setOpen] = useState(false);
  const ruleCount = (css.match(/\{[^}]*\}/g) ?? []).length;
  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper
      as="div"
      data-style-block
      contentEditable={false}
      style={{
        margin: "0.5rem 0",
        borderRadius: 6,
        border: "1px solid #d0d7de",
        background: "#f6f8fa",
        fontSize: "0.8125rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.4rem 0.6rem",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            aria-hidden="true"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 600,
              color: "#0550ae",
            }}
          >
            &lt;style&gt;
          </span>
          <span style={{ color: "#57606a" }}>
            {ruleCount === 0
              ? "Empty CSS block"
              : `${ruleCount} rule${ruleCount === 1 ? "" : "s"} (applied live)`}
          </span>
        </div>
        {isEditable && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              border: "1px solid #d0d7de",
              background: "#fff",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {open ? "Done" : "Edit CSS"}
          </button>
        )}
      </div>
      {open && isEditable && (
        <textarea
          value={css}
          onChange={(e) => updateAttributes({ css: e.target.value })}
          spellCheck={false}
          rows={Math.min(Math.max(4, css.split("\n").length), 18)}
          style={{
            width: "100%",
            border: "none",
            borderTop: "1px solid #d0d7de",
            background: "#0d1117",
            color: "#e6edf3",
            padding: "0.6rem 0.75rem",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.8125rem",
            lineHeight: 1.55,
            resize: "vertical",
            outline: "none",
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
          }}
        />
      )}
      {/*
        Real <style> element — applies the rules live inside the editor so
        authors can see their styling without switching back to HTML view.
        Marked as a node-view child so Tiptap leaves it alone.
      */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </NodeViewWrapper>
  );
}

export const StyleBlock = Node.create({
  name: "styleBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      css: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "style",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return { css: element.textContent ?? "" };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const css = (node.attrs as StyleBlockAttrs).css ?? "";
    return ["style", mergeAttributes(HTMLAttributes), css];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StyleBlockView);
  },
});

export default StyleBlock;
