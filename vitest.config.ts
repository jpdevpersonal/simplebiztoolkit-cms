import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Run tests in the main thread to avoid flakiness from worker concurrency
    threads: false,
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    hookTimeout: 30000,
    exclude: ["src/e2e/**", "node_modules/**", ".next/**"],
    clearMocks: true,
    restoreMocks: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
      exclude: [
        "**/*.d.ts",
        "**/*.test.*",
        "src/test/**",
        "**/node_modules/**",
        // Tiptap editor internals are validated in integration flows (build/e2e),
        // and are excluded from unit-test global coverage thresholds.
        "src/editor/extensions/**",
        "src/editor/EditorToolbar.tsx",
        "src/editor/blockSelection.ts",
        "src/components/TiptapEditor.tsx",
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 60,
        lines: 72,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
