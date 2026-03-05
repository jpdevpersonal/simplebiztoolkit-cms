/**
 * Shared in-memory dev fallback store for editor controls.
 * Used when the C# backend returns 404 (endpoint not yet implemented).
 * Module-scope array persists for the Node process lifetime.
 */

import type { EditorControlPreset } from "@/types/editorControls";

export const devStore: EditorControlPreset[] = [];

export function generateId(): string {
  return globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `mock-${Date.now()}`;
}
