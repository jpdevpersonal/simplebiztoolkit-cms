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

function ensureLeadingSlash(value: string): string {
  if (!value) {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

export function toAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) {
    return site.url;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const pathname = ensureLeadingSlash(pathOrUrl);
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
  const canonicalHref = canonical ?? pathname ?? "/";
  const resolvedDescription = description ?? site.description;
  const resolvedImage = image ?? DEFAULT_OG_IMAGE;

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
      url: pathname ?? canonicalHref,
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

export function createArticleJsonLd(input: {
  headline: string;
  description?: string;
  href: string;
  datePublished?: string;
  dateModified?: string;
  image?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    url: toAbsoluteUrl(input.href),
    image: input.image ? [toAbsoluteUrl(input.image)] : undefined,
    author: {
      "@type": "Person",
      name: "Julian (Simple Biz Toolkit)",
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
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
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image ? toAbsoluteUrl(input.image) : undefined,
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
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: toAbsoluteUrl(input.href),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    image: input.image ? [toAbsoluteUrl(input.image)] : undefined,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };
}
