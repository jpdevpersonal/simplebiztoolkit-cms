/**
 * Locking – TipTap extension that prevents editing, deleting or moving
 * any block that has `locked: true` set on its node attributes.
 *
 * When a node is locked:
 *   • Its content cannot be changed (text input, paste, drop are blocked)
 *   • It cannot be deleted (Backspace / Delete at the node boundary are blocked)
 *   • It cannot be cut or drag-reordered
 *
 * Locking is enforced at the ProseMirror transaction-filter level, which is
 * the only reliable approach — DOM-level event blocking alone can be bypassed
 * by editor commands.
 *
 * ── Commands added to the editor ─────────────────────────────────────────────
 *   editor.commands.lockBlock(reason?)   – lock the innermost lockable block
 *   editor.commands.unlockBlock()        – unlock the innermost lockable block
 *   editor.commands.toggleLock(reason?)  – toggle lock on the innermost block
 *
 * ── Bypass meta key ──────────────────────────────────────────────────────────
 * Our own lock/unlock commands tag their transactions with the meta key so the
 * filter lets them through:
 *   tr.setMeta(LOCKING_META_KEY, { allowLockedModification: true })
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { Transaction, EditorState } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LockedRange {
  /** Position of the node's opening token in the flat document. */
  pos: number;
  /** Alias for `pos` – matches the StepMap "oldStart" convention. */
  from: number;
  /** `pos + nodeSize` – position after the closing token. */
  to: number;
  node: PMNode;
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Returns one `LockedRange` entry for every locked node in `doc`.
 * Descending into an already-locked node is skipped because its children
 * are already protected by the parent's range.
 */
export function findLockedRanges(doc: PMNode): LockedRange[] {
  const ranges: LockedRange[] = [];

  doc.descendants((node, pos) => {
    if (node.attrs?.locked === true) {
      ranges.push({ pos, from: pos, to: pos + node.nodeSize, node });
      return false; // skip children — covered by parent range
    }
    return true;
  });

  return ranges;
}

/**
 * Returns `true` when the current selection overlaps any locked node.
 */
export function isSelectionInLockedNode(state: EditorState): boolean {
  const { from, to } = state.selection;
  return findLockedRanges(state.doc).some((r) => from < r.to && to > r.from);
}

/**
 * Returns `true` when at least one step in `tr` would touch a range that
 * belongs to a locked node as recorded in `doc` (the document BEFORE the
 * transaction).
 *
 * Detection strategy (two complementary layers):
 *  1. `step.getMap().forEach(oldStart, oldEnd, …)` – the public ProseMirror
 *     StepMap API; works for ReplaceStep, AddMarkStep, RemoveMarkStep.
 *  2. Direct `step.from / step.to` property inspection as a fallback for
 *     step types whose StepMap is empty (e.g. AttrStep).
 */
export function transactionTouchesLocked(
  tr: Transaction,
  doc: PMNode,
): boolean {
  const lockedRanges = findLockedRanges(doc);
  if (lockedRanges.length === 0) return false;

  for (const step of tr.steps) {
    let found = false;

    // ── Layer 1: StepMap ──────────────────────────────────────────────────
    step.getMap().forEach((oldStart: number, oldEnd: number) => {
      if (found) return;
      for (const { from, to } of lockedRanges) {
        if (oldStart < to && oldEnd > from) {
          found = true;
          break;
        }
      }
    });
    if (found) return true;

    // ── Layer 2: direct .from / .to fallback ─────────────────────────────
    const s = step as unknown as { from?: number; to?: number };
    if (s.from !== undefined && s.to !== undefined) {
      for (const { from, to } of lockedRanges) {
        if (s.from < to && s.to > from) return true;
      }
    }
  }

  return false;
}

// ─── Meta key used to bypass the filter for intentional lock changes ──────────

export const LOCKING_META_KEY = "lockingExtension";

// ─── Command type augmentation ────────────────────────────────────────────────

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    locking: {
      /** Lock the innermost lockable block containing the cursor. */
      lockBlock: (reason?: string) => ReturnType;
      /** Unlock the innermost lockable block containing the cursor. */
      unlockBlock: () => ReturnType;
      /** Toggle lock state on the innermost lockable block. */
      toggleLock: (reason?: string) => ReturnType;
    };
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const lockingPluginKey = new PluginKey<null>("locking");

/**
 * Applies a lock-state change to the node at `pos` and stamps the transaction
 * with the bypass meta key so `filterTransaction` lets it through.
 */
function applyLockChange(
  tr: Transaction,
  pos: number,
  node: PMNode,
  locked: boolean,
  reason?: string,
): void {
  const newAttrs: Record<string, unknown> = { ...node.attrs, locked };
  if (locked && reason !== undefined) {
    newAttrs.lockReason = reason;
  } else if (!locked) {
    newAttrs.lockReason = null; // clear reason on unlock
  }
  tr.setNodeMarkup(pos, undefined, newAttrs as Record<string, unknown>);
  tr.setMeta(LOCKING_META_KEY, { allowLockedModification: true });
}

/**
 * Shared logic for lockBlock / unlockBlock / toggleLock:
 * walks up the ancestor stack from the cursor looking for a lockable node.
 * Also handles NodeSelection where the selected node itself may be lockable.
 */
function findAndMutateLock(
  tr: Transaction,
  state: EditorState,
  dispatch: ((tr: Transaction) => void) | undefined,
  locked: boolean,
  reason?: string,
): boolean {
  const { selection } = state;
  const { $from } = selection;

  // NodeSelection: the node itself is the target
  const directNode = (selection as unknown as { node?: PMNode }).node;
  if (directNode?.attrs != null && "locked" in directNode.attrs) {
    if (dispatch) {
      applyLockChange(tr, selection.from, directNode, locked, reason);
      dispatch(tr);
    }
    return true;
  }

  // TextSelection / AllSelection: walk ancestor chain
  for (let depth = $from.depth; depth >= 1; depth--) {
    const node = $from.node(depth);
    if (node.attrs != null && "locked" in node.attrs) {
      const nodePos = $from.before(depth);
      if (dispatch) {
        applyLockChange(tr, nodePos, node, locked, reason);
        dispatch(tr);
      }
      return true;
    }
  }

  return false;
}

// ─── Extension ───────────────────────────────────────────────────────────────

export const Locking = Extension.create({
  name: "locking",

  addCommands() {
    return {
      lockBlock:
        (reason?: string) =>
        ({ tr, state, dispatch }) =>
          findAndMutateLock(tr, state, dispatch, true, reason),

      unlockBlock:
        () =>
        ({ tr, state, dispatch }) =>
          findAndMutateLock(tr, state, dispatch, false, undefined),

      toggleLock:
        (reason?: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;

          // Determine current lock state before deciding next state
          const directNode = (selection as unknown as { node?: PMNode }).node;
          if (directNode?.attrs != null && "locked" in directNode.attrs) {
            const nextLocked = !directNode.attrs.locked;
            if (dispatch) {
              applyLockChange(
                tr,
                selection.from,
                directNode,
                nextLocked,
                nextLocked ? reason : undefined,
              );
              dispatch(tr);
            }
            return true;
          }

          for (let depth = $from.depth; depth >= 1; depth--) {
            const node = $from.node(depth);
            if (node.attrs != null && "locked" in node.attrs) {
              const nextLocked = !node.attrs.locked;
              const nodePos = $from.before(depth);
              if (dispatch) {
                applyLockChange(
                  tr,
                  nodePos,
                  node,
                  nextLocked,
                  nextLocked ? reason : undefined,
                );
                dispatch(tr);
              }
              return true;
            }
          }

          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: lockingPluginKey,

        // ── Transaction filter ─────────────────────────────────────────────
        filterTransaction(tr: Transaction, state: EditorState): boolean {
          // Metadata-only / selection-only transactions are always allowed
          if (!tr.docChanged) return true;

          // Transactions explicitly authorised by our own commands
          if (
            (
              tr.getMeta(LOCKING_META_KEY) as
                | { allowLockedModification?: boolean }
                | undefined
            )?.allowLockedModification
          ) {
            return true;
          }

          // Block anything whose steps overlap locked content
          return !transactionTouchesLocked(tr, state.doc);
        },

        props: {
          // ── Keyboard: Backspace / Delete near locked boundaries ──────────
          handleKeyDown(view, event) {
            if (event.key !== "Backspace" && event.key !== "Delete")
              return false;

            const { state } = view;
            const { selection } = state;
            const ranges = findLockedRanges(state.doc);
            if (ranges.length === 0) return false;

            for (const { from, to } of ranges) {
              // Selection overlaps the locked range — block the key
              if (selection.from < to && selection.to > from) return true;
              // Cursor sits immediately after the closing token → Backspace
              if (
                event.key === "Backspace" &&
                selection.empty &&
                selection.from === to
              )
                return true;
              // Cursor sits immediately before the opening token → Delete
              if (
                event.key === "Delete" &&
                selection.empty &&
                selection.from === from
              )
                return true;
            }
            return false;
          },

          handleDOMEvents: {
            // ── Cut: prevent when selection touches locked content ─────────
            cut(view, event) {
              if (isSelectionInLockedNode(view.state)) {
                event.preventDefault();
                return true;
              }
              return false;
            },

            // ── Drop: prevent drop onto locked content ─────────────────────
            drop(view, event) {
              const dragEvent = event as DragEvent;
              const resolved = view.posAtCoords({
                left: dragEvent.clientX,
                top: dragEvent.clientY,
              });
              if (!resolved) return false;

              const ranges = findLockedRanges(view.state.doc);
              for (const { from, to } of ranges) {
                if (resolved.pos >= from && resolved.pos <= to) {
                  event.preventDefault();
                  return true;
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});
