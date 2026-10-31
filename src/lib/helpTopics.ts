import { slugify } from "@/lib/slugify";

export type HelpTopic = { id: string; title: string };

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Gives every `<h3>` in the help content a stable id (keeping any existing
 * id) and returns them as jump-to topics, so the topic list always matches
 * whatever is authored in the CMS.
 */
export function addHelpTopicAnchors(html: string): {
  html: string;
  topics: HelpTopic[];
} {
  const topics: HelpTopic[] = [];
  const used = new Set<string>();

  const withIds = html.replace(
    /<h3(\s[^>]*)?>([\s\S]*?)<\/h3>/gi,
    (match, attrs: string | undefined, inner: string) => {
      const title = stripTags(inner);
      if (!title) return match;

      const existingId = attrs?.match(/\bid\s*=\s*(["'])([^"']+)\1/i)?.[2];
      let id = existingId ?? `help-${slugify(title) || "topic"}`;
      if (!existingId) {
        let suffix = 2;
        const base = id;
        while (used.has(id)) id = `${base}-${suffix++}`;
      }
      used.add(id);
      topics.push({ id, title });

      return existingId ? match : `<h3 id="${id}"${attrs ?? ""}>${inner}</h3>`;
    },
  );

  return { html: withIds, topics };
}
