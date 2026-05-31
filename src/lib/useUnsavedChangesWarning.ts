"use client";

import { useEffect } from "react";

/**
 * Warns the user before they leave the page (tab close, reload, or browser
 * back/forward) while there are unsaved changes in an admin editor.
 *
 * This guards against accidental data loss. It only covers full-page
 * navigations and unloads — in-app router navigations triggered after a
 * successful save are unaffected because `enabled` is false by then.
 */
export function useUnsavedChangesWarning(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required for some browsers to trigger the native confirmation prompt.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);
}
