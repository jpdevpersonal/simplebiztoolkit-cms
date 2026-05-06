import Image from "next/image";
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

  const hasAnyImages = items.some((item) => Boolean(item.imageUrl));
  const imageSizes = getImageSizes(imageSize);

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
            <li key={item.uid} className="related-links-block__item">
              <a
                href={item.href}
                className={`related-links-block__link${hasAnyImages ? "" : " related-links-block__link--text-only"}`}
              >
                {hasAnyImages ? (
                  hasImage ? (
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
                        style={{ objectPosition: getImageObjectPosition(item) }}
                        className="related-links-block__image"
                      />
                    </span>
                  ) : (
                    <span
                      className="related-links-block__media-placeholder"
                      aria-hidden="true"
                    />
                  )
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
