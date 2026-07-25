import type { Metadata } from "next";
import { site } from "@/config/site";

type JsonLd = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  href: string;
};

type MetadataInput = {
  title: string;
  description?: string;
  pathname?: string;
  canonical?: string;
  openGraphTitle?: string;
  twitterTitle?: string;
  image?: string | null;
  openGraphType?: "website" | "article";
};

const DEFAULT_OG_IMAGE = "/images/hero-image-desk.webp";
const ABSOLUTE_HTTP_URL_REGEX = /^https?:\/\//i;
const DISALLOWED_URL_SCHEME_REGEX = /^[a-z][a-z\d+\-.]*:/i;

function ensureLeadingSlash(value: string): string {
  if (!value) {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

export function normalizePublicUrl(
  pathOrUrl?: string | null,
): string | undefined {
  if (!pathOrUrl) {
    return undefined;
  }

  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return undefined;
  }

  if (ABSOLUTE_HTTP_URL_REGEX.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return undefined;
    }
  }

  if (trimmed.startsWith("//")) {
    try {
      return new URL(trimmed, site.url).toString();
    } catch {
      return undefined;
    }
  }

  // Reject non-web schemes such as file:, mailto:, and Windows drive paths.
  if (trimmed.includes("\\") || DISALLOWED_URL_SCHEME_REGEX.test(trimmed)) {
    return undefined;
  }

  try {
    const normalized = new URL(ensureLeadingSlash(trimmed), site.url);
    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return undefined;
  }
}

export function toAbsoluteUrl(pathOrUrl?: string | null): string {
  const normalized = normalizePublicUrl(pathOrUrl);

  if (!normalized) {
    return site.url;
  }

  if (ABSOLUTE_HTTP_URL_REGEX.test(normalized)) {
    return normalized;
  }

  const pathname = ensureLeadingSlash(normalized);
  return pathname === "/" ? site.url : `${site.url}${pathname}`;
}

export function createPageMetadata({
  title,
  description,
  pathname,
  canonical,
  openGraphTitle,
  twitterTitle,
  image,
  openGraphType = "website",
}: MetadataInput): Metadata {
  const normalizedPathname = normalizePublicUrl(pathname);
  const canonicalHref =
    normalizePublicUrl(canonical) ?? normalizedPathname ?? "/";
  const resolvedDescription = description ?? site.description;
  const resolvedImage = normalizePublicUrl(image) ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalHref,
    },
    openGraph: {
      type: openGraphType,
      title: openGraphTitle ?? title,
      description: resolvedDescription,
      url: normalizedPathname ?? canonicalHref,
      images: resolvedImage ? [{ url: resolvedImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle ?? openGraphTitle ?? title,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}

export function createWebsiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: "SimpleBizToolkit",
    description: site.description,
    url: site.url,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/templates?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization JSON-LD emitted on every page. Includes the Etsy-sourced
 * AggregateRating used as an Etsy-seller signal (Organization-level only — we
 * do not attach AggregateRating to individual Products to avoid Google's
 * self-serving review-spam penalty).
 */
export function createOrganizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: toAbsoluteUrl(site.logoPath),
    description: site.description,
    email: site.contactEmail,
    sameAs: [...site.socialUrls],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.trust.ratingValue.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: site.trust.reviewCount,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.contactEmail,
      url: `${site.url}/contact`,
      availableLanguage: ["English"],
    },
  };
}

export function createFaqJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// export function createHowToJsonLd(input: {
//   name: string;
//   description?: string;
//   steps: ReadonlyArray<{ name: string; text: string; url?: string }>;
//   totalTimeMinutes?: number;
// }): JsonLd {
//   return {
//     "@context": "https://schema.org",
//     "@type": "HowTo",
//     name: input.name,
//     description: input.description,
//     totalTime: input.totalTimeMinutes
//       ? `PT${input.totalTimeMinutes}M`
//       : undefined,
//     step: input.steps.map((step, index) => ({
//       "@type": "HowToStep",
//       position: index + 1,
//       name: step.name,
//       text: step.text,
//       url: step.url,
//     })),
//   };
// }

export function createItemListJsonLd(input: {
  name?: string;
  items: ReadonlyArray<{ name: string; href: string; image?: string | null }>;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: toAbsoluteUrl(item.href),
      ...(item.image
        ? { image: toAbsoluteUrl(normalizePublicUrl(item.image) ?? item.image) }
        : {}),
    })),
  };
}

export function createArticleJsonLd(input: {
  headline: string;
  description?: string;
  href: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | null;
  authorName?: string;
  wordCount?: number;
}): JsonLd {
  const image = normalizePublicUrl(input.image);
  const authorName = input.authorName ?? site.name;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: toAbsoluteUrl(input.href),
    url: toAbsoluteUrl(input.href),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: image ? [toAbsoluteUrl(image)] : undefined,
    wordCount: input.wordCount,
    inLanguage: "en-GB",
    author: {
      "@type": "Organization",
      name: authorName,
      url: site.url,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(site.logoPath),
      },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".content-subtitle", "article p:first-of-type"],
    },
  };
}

export function createAboutPageJsonLd(input: {
  name: string;
  description: string;
  href: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: input.name,
    description: input.description,
    url: toAbsoluteUrl(input.href),
    mainEntity: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
      logo: toAbsoluteUrl(site.logoPath),
    },
  };
}

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.href),
    })),
  };
}

export function createCollectionPageJsonLd(input: {
  name: string;
  description?: string;
  href: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: toAbsoluteUrl(input.href),
  };
}

export function createProductJsonLd(input: {
  name: string;
  description?: string;
  href: string;
  image?: string | null;
  price?: string;
  currency?: string;
  offerUrl?: string;
  sku?: string;
  category?: string;
  /**
   * Extra product-specific attributes (e.g., page size, file format). Rendered
   * as `additionalProperty` PropertyValue entries — useful AI-search signal.
   */
  attributes?: ReadonlyArray<{ name: string; value: string }>;
}): JsonLd {
  const image = normalizePublicUrl(input.image);
  const absoluteImage = image ? toAbsoluteUrl(image) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: absoluteImage,
    url: toAbsoluteUrl(input.href),
    sku: input.sku,
    category: input.category,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    additionalProperty: input.attributes?.map((attr) => ({
      "@type": "PropertyValue",
      name: attr.name,
      value: attr.value,
    })),
    offers: input.price
      ? {
          "@type": "Offer",
          price: input.price.replace("$", ""),
          priceCurrency: input.currency ?? "USD",
          availability: "https://schema.org/InStock",
          url: input.offerUrl,
          seller: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
        }
      : undefined,
  };
}

export function createWebPageJsonLd(input: {
  name: string;
  description?: string;
  href: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | null;
}): JsonLd {
  const image = normalizePublicUrl(input.image);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: toAbsoluteUrl(input.href),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: image ? [toAbsoluteUrl(image)] : undefined,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };
}
