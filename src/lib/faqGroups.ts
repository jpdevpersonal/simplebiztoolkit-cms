import type { Faq } from "@/lib/api";
import { slugify } from "@/lib/slugify";

export const DEFAULT_FAQ_GROUP = "General";

export function faqGroupName(faq: Pick<Faq, "group">): string {
  return faq.group?.trim() || DEFAULT_FAQ_GROUP;
}

export function faqGroupId(group: string): string {
  return `faq-group-${slugify(group) || "general"}`;
}

/** Groups FAQs, keeping groups (and questions within them) in first-seen order. */
export function groupFaqs<T extends Pick<Faq, "group">>(
  faqs: T[],
): Array<{ group: string; id: string; faqs: T[] }> {
  const groups = new Map<string, T[]>();
  for (const faq of faqs) {
    const group = faqGroupName(faq);
    const list = groups.get(group);
    if (list) list.push(faq);
    else groups.set(group, [faq]);
  }
  return Array.from(groups, ([group, items]) => ({
    group,
    id: faqGroupId(group),
    faqs: items,
  }));
}
