/**
 * blockSelection – ProseMirror helpers for operating on the top-level block
 * that contains (or is) the current editor selection.
 *
 * All functions follow the ProseMirror command convention: they accept an
 * optional `dispatch` callback and return `true` when the operation is
 * applicable (even if `dispatch` was not provided).
 *
 * Block controls (duplicate / delete / move) deliberately let the Locking
 * extension's `filterTransaction` plugin handle protection for locked nodes —
 * if a block is locked, the dispatched transaction will be silently blocked.
 */

import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlockRange {
  /** The top-level block node. */
  node: PMNode;
  /** Absolute position of the node's opening token (same as `from`). */
  pos: number;
  /** Alias for `pos`. */
  from: number;
  /** `pos + node.nodeSize` — position after the node's closing token. */
  to: number;
  /** Zero-based index of this node among the document's direct children. */
  index: number;
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Returns the top-level block (direct child of the document) that contains or
 * is the current selection.
 *
 * Handles both:
 *  • TextSelection  — walks up from `$from` to depth 1.
 *  • NodeSelection  — the selected atom node is itself a top-level block.
 */
export function getTopLevelBlock(state: EditorState): BlockRange | null {
  const { selection } = state;
  const { $from } = selection;

  // ── NodeSelection (atom nodes like CTA / ImageBlock) ──────────────────────
  const ns = selection as { node?: PMNode };
  if (ns.node) {
    // For a NodeSelection on a top-level node, $from points to the position
    // just before the node inside the document → $from.depth === 0.
    const $resolved = state.doc.resolve(selection.from);
    if ($resolved.depth === 0) {
      const index = $resolved.index(0);
      return {
        node: ns.node,
        pos: selection.from,
        from: selection.from,
        to: selection.from + ns.node.nodeSize,
        index,
      };
    }
  }

  // ── TextSelection (cursor or text range) ──────────────────────────────────
  // depth 0 means we're inside the document root itself — shouldn't happen
  // in practice for a content selection.
  if ($from.depth < 1) return null;

  const node = $from.node(1);
  const pos = $from.before(1);
  const index = $from.index(0);

  return { node, pos, from: pos, to: pos + node.nodeSize, index };
}

// ─── Can-check helpers ────────────────────────────────────────────────────────

/** `true` when the selected block can be moved up (is not the first child). */
export function canMoveBlockUp(state: EditorState): boolean {
  const block = getTopLevelBlock(state);
  return block !== null && block.index > 0;
}

/** `true` when the selected block can be moved down (is not the last child). */
export function canMoveBlockDown(state: EditorState): boolean {
  const block = getTopLevelBlock(state);
  return block !== null && block.index < state.doc.childCount - 1;
}

// ─── Block commands ───────────────────────────────────────────────────────────

/**
 * Inserts a copy of the current top-level block immediately after it.
 *
 * If the block has a `locked` attribute, the duplicated node is created with
 * `locked: false` so the copy is immediately editable.
 */
export function duplicateBlock(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const block = getTopLevelBlock(state);
  if (!block) return false;

  if (dispatch) {
    const tr = state.tr;

    // Strip the lock when duplicating so the new copy is editable.
    let copied: PMNode;
    if (block.node.attrs != null && "locked" in block.node.attrs) {
      const attrs = { ...block.node.attrs, locked: false, lockReason: null };
      copied = block.node.type.create(
        attrs,
        block.node.content,
        block.node.marks,
      );
    } else {
      copied = block.node.copy(block.node.content);
    }

    // Insert AFTER the current block.  Inserting at block.to (which is
    // outside the locked range [from, to)) is always permitted by the
    // Locking plugin's filter.
    tr.insert(block.to, copied);
    dispatch(tr);
  }

  return true;
}

/**
 * Removes the current top-level block.
 * Locked blocks are protected by the Locking plugin's filterTransaction.
 */
export function deleteBlock(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const block = getTopLevelBlock(state);
  if (!block) return false;

  if (dispatch) {
    const tr = state.tr;
    tr.delete(block.from, block.to);
    dispatch(tr);
  }

  return true;
}

/**
 * Swaps the current top-level block with the preceding sibling.
 *
 * Strategy: delete the current node first, then re-insert it at the start of
 * where the previous node was.  Because the deletion range starts at
 * `block.from` (which is after `prevStart`), the position `prevStart` is
 * unaffected by the deletion and maps to itself — no position remapping needed
 * for the insert.
 */
export function moveBlockUp(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const block = getTopLevelBlock(state);
  if (!block || block.index === 0) return false;

  const prevNode = state.doc.child(block.index - 1);
  const prevStart = block.from - prevNode.nodeSize;

  if (dispatch) {
    const tr = state.tr;
    tr.delete(block.from, block.to);
    // prevStart is before the deleted range → position unchanged after delete.
    tr.insert(tr.mapping.map(prevStart), block.node);
    dispatch(tr);
  }

  return true;
}

/**
 * Swaps the current top-level block with the following sibling.
 *
 * Strategy: delete the current node, then insert it at the mapped position of
 * what was the end of the next sibling.  The deletion shifts positions after
 * `block.from` backwards by `block.node.nodeSize`, which `tr.mapping.map`
 * handles automatically.
 */
export function moveBlockDown(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const block = getTopLevelBlock(state);
  if (!block || block.index >= state.doc.childCount - 1) return false;

  const nextNode = state.doc.child(block.index + 1);
  const nextEnd = block.to + nextNode.nodeSize;

  if (dispatch) {
    const tr = state.tr;
    tr.delete(block.from, block.to);
    // Map nextEnd through the delete so it points to the correct position in
    // the post-delete document.
    tr.insert(tr.mapping.map(nextEnd), block.node);
    dispatch(tr);
  }

  return true;
}
