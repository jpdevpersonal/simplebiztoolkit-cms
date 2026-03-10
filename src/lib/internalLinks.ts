import { slugify } from "@/lib/slugify";

export type InternalLinkTarget = {
  title: string;
  href: string;
  description?: string;
  kind: "article" | "product" | "category" | "page" | "tool";
  score?: number;
};

type RelatedCandidate = {
  slug: string;
  title: string;
  description?: string;
  category?: string;
};

function tokenize(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

function calculateRelatedScore(
  current: RelatedCandidate,
  candidate: RelatedCandidate,
): number {
  let score = 0;

  if (
    current.category &&
    candidate.category &&
    current.category === candidate.category
  ) {
    score += 4;
  }

  const currentTokens = new Set([
    ...tokenize(current.title),
    ...tokenize(current.description),
  ]);
  const candidateTokens = [
    ...tokenize(candidate.title),
    ...tokenize(candidate.description),
  ];

  for (const token of candidateTokens) {
    if (currentTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function getArticleHref(slug: string): string {
  return `/blog/${slug}`;
}

export function getProductCategoryHref(categorySlug: string): string {
  return `/products/${categorySlug}`;
}

export function getProductHref(
  categorySlug: string,
  productSlug: string,
): string {
  return `/products/${categorySlug}/${productSlug}`;
}

export function getMenuLandingHref(menuTitle: string): string {
  return `/pages/${slugify(menuTitle)}`;
}

export function getMenuCategoryHref(
  menuTitle: string,
  categoryTitle: string,
): string {
  return `${getMenuLandingHref(menuTitle)}/${slugify(categoryTitle)}`;
}

export function getPageHref(slug: string): string {
  return `/${slug}`;
}

export function getToolHref(slug: string): string {
  return `/tools/${slug}`;
}

export function buildRelatedLinks<T extends RelatedCandidate>(input: {
  current: T;
  candidates: T[];
  limit?: number;
  minScore?: number;
  kind: InternalLinkTarget["kind"];
  getHref: (candidate: T) => string;
}): InternalLinkTarget[] {
  const limit = input.limit ?? 3;
  const minScore = input.minScore ?? 2;

  return input.candidates
    .filter((candidate) => candidate.slug !== input.current.slug)
    .map((candidate) => ({
      title: candidate.title,
      href: input.getHref(candidate),
      description: candidate.description,
      kind: input.kind,
      score: calculateRelatedScore(input.current, candidate),
    }))
    .filter((candidate) => (candidate.score ?? 0) >= minScore)
    .sort((left, right) => {
      if ((right.score ?? 0) !== (left.score ?? 0)) {
        return (right.score ?? 0) - (left.score ?? 0);
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(pageSize, 1);
  const safePage = Math.max(page, 1);
  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems: items.length,
    totalPages: Math.max(Math.ceil(items.length / safePageSize), 1),
    items: items.slice(startIndex, endIndex),
    hasPreviousPage: safePage > 1,
    hasNextPage: endIndex < items.length,
  };
}
