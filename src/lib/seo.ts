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
    description: site.description,
    url: site.url,
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
}): JsonLd {
  const image = normalizePublicUrl(input.image);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: image ? toAbsoluteUrl(image) : undefined,
    url: toAbsoluteUrl(input.href),
    brand: {
      "@type": "Organization",
      name: site.name,
    },
    offers: input.price
      ? {
          "@type": "Offer",
          price: input.price.replace("$", ""),
          priceCurrency: input.currency ?? "USD",
          availability: "https://schema.org/InStock",
          url: input.offerUrl,
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
