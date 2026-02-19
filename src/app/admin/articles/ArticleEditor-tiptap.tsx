/**
 * ArticleEditor-tiptap
 *
 * Re-exports the shared TiptapEditor component from src/components.
 * This file is kept for backwards compatibility and the explicit naming
 * requested during initial setup.  Import TiptapEditor directly from
 * "@/components/TiptapEditor" for new code.
 */

export { default } from "@/components/TiptapEditor";
export type { TiptapEditorProps as ArticleEditorTiptapProps } from "@/components/TiptapEditor";
