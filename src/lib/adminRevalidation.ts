import { clientApi } from "@/lib/clientApi";

function normalizeSlugs(candidates: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      candidates
        .map((candidate) => candidate?.trim())
        .filter((candidate): candidate is string => Boolean(candidate)),
    ),
  );
}

export async function revalidateArticleContent(slug?: string) {
  await clientApi.revalidateContent("article", slug);
}

export async function revalidateProductContent(
  ...candidateSlugs: Array<string | undefined>
) {
  const uniqueSlugs = normalizeSlugs(candidateSlugs);

  await Promise.all(
    uniqueSlugs.map((candidateSlug) =>
      clientApi.revalidateContent("product", candidateSlug),
    ),
  );
}

export async function revalidatePageContent(
  currentSlug?: string,
  previousSlug?: string,
) {
  await clientApi.revalidateContent("page", currentSlug, previousSlug);
}

export async function revalidateMenuContent() {
  await clientApi.revalidateContent("page");
}
