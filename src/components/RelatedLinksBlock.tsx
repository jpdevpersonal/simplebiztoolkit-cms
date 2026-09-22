import Image from "next/image";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import {
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  RELATED_LINKS_DEFAULT_IMAGE_SIZE,
  normalizeRelatedLinkImagePositionY,
  type RelatedLinkItem,
  type RelatedLinksImageSize,
} from "@/lib/relatedLinks";

type RelatedLinksBlockProps = {
  title: string;
  items: RelatedLinkItem[];
  variant?: "content" | "template";
  backgroundColor?: string;
  borderWidth?: number;
  imageSize?: RelatedLinksImageSize;
};

type RelatedLinksImageRenderSpec = {
  desktopWidth: number;
  mobileWidth: number;
};

const IMAGE_RENDER_SPECS: Record<
  RelatedLinksImageSize,
  RelatedLinksImageRenderSpec
> = {
  small: {
    desktopWidth: 72,
    mobileWidth: 64,
  },
  medium: {
    desktopWidth: 108,
    mobileWidth: 96,
  },
  large: {
    desktopWidth: 144,
    mobileWidth: 128,
  },
  "extra-large": {
    desktopWidth: 216,
    mobileWidth: 192,
  },
};

function getImageSizes(imageSize: RelatedLinksImageSize): string {
  const spec = IMAGE_RENDER_SPECS[imageSize];
  return `(max-width: 768px) ${spec.mobileWidth}px, ${spec.desktopWidth}px`;
}

function getItemLabel(item: RelatedLinkItem): string {
  return item.label?.trim() || item.destinationTitle;
}

function getImageObjectPosition(item: RelatedLinkItem): string {
  return `center ${normalizeRelatedLinkImagePositionY(item.imagePositionY)}%`;
}

function getTemplateItemCta(item: RelatedLinkItem): string {
  if (item.kind === "template") return "View template";
  if (item.kind === "page") return "Read more";
  return "Open link";
}

export default function RelatedLinksBlock({
  title,
  items,
  variant = "content",
  backgroundColor,
  borderWidth,
  imageSize = RELATED_LINKS_DEFAULT_IMAGE_SIZE,
}: RelatedLinksBlockProps) {
  if (items.length === 0) {
    return null;
  }

  const imageSizes = getImageSizes(imageSize);

  if (variant === "template") {
    return (
      <section
        className={`related-links-block related-links-block--template related-links-block--image-size-${imageSize}`}
        aria-label={title}
      >
        <span className="sb-section-eyebrow">Related items</span>
        <h2 className="related-links-block__title">{title}</h2>
        <ul className="related-links-block__list">
          {items.map((item) => {
            const hasImage = Boolean(item.imageUrl);

            return (
              <li key={item.uid} className="related-links-block__item">
                <a href={item.href} className="related-links-block__link">
                  {hasImage ? (
                    <span
                      className="related-links-block__media"
                      aria-hidden="true"
                    >
                      <Image
                        src={item.imageUrl || ""}
                        alt={item.imageAlt || ""}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                        quality={90}
                        unoptimized={shouldBypassNextImageOptimization(
                          item.imageUrl,
                        )}
                        style={{ objectPosition: getImageObjectPosition(item) }}
                        className="related-links-block__image"
                      />
                    </span>
                  ) : (
                    <span
                      className="related-links-block__media related-links-block__media--placeholder"
                      aria-hidden="true"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 3v5h5M9 13h6M9 17h4"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )}
                  <span className="related-links-block__body">
                    <span className="related-links-block__text">
                      {getItemLabel(item)}
                    </span>
                    <span className="related-links-block__cta">
                      {getTemplateItemCta(item)}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={`related-links-block related-links-block--${variant} related-links-block--image-size-${imageSize}`}
      style={{
        background: backgroundColor || RELATED_LINKS_DEFAULT_BACKGROUND,
        borderWidth:
          typeof borderWidth === "number"
            ? `${borderWidth}px`
            : `${RELATED_LINKS_DEFAULT_BORDER_WIDTH}px`,
      }}
    >
      <h3 className="related-links-block__title">{title}</h3>
      <ul className="related-links-block__list">
        {items.map((item) => {
          const hasImage = Boolean(item.imageUrl);

          return (
            <li
              key={item.uid}
              className={`related-links-block__item${hasImage ? " related-links-block__item--has-image" : " related-links-block__item--no-image"}`}
            >
              <a
                href={item.href}
                className={`related-links-block__link${hasImage ? " related-links-block__link--has-image" : " related-links-block__link--no-image"}`}
              >
                {hasImage ? (
                  <span
                    className="related-links-block__media"
                    aria-hidden="true"
                  >
                    <Image
                      src={item.imageUrl || ""}
                      alt={item.imageAlt || ""}
                      fill
                      sizes={imageSizes}
                      loading="lazy"
                      quality={90}
                      unoptimized={shouldBypassNextImageOptimization(
                        item.imageUrl,
                      )}
                      style={{ objectPosition: getImageObjectPosition(item) }}
                      className="related-links-block__image"
                    />
                  </span>
                ) : null}
                <span className="related-links-block__text">
                  {getItemLabel(item)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
