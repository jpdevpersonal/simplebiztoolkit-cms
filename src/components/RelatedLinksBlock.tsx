import {
  RELATED_LINKS_DEFAULT_BACKGROUND,
  RELATED_LINKS_DEFAULT_BORDER_WIDTH,
  type RelatedLinkItem,
} from "@/lib/relatedLinks";

type RelatedLinksBlockProps = {
  title: string;
  items: RelatedLinkItem[];
  variant?: "content" | "template";
  backgroundColor?: string;
  borderWidth?: number;
};

function getItemLabel(item: RelatedLinkItem): string {
  return item.label?.trim() || item.destinationTitle;
}

export default function RelatedLinksBlock({
  title,
  items,
  variant = "content",
  backgroundColor,
  borderWidth,
}: RelatedLinksBlockProps) {
  if (items.length === 0) {
    return null;
  }

  const hasAnyImages = items.some((item) => Boolean(item.imageUrl));

  return (
    <section
      className={`related-links-block related-links-block--${variant}`}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl || ""}
                        alt={item.imageAlt || ""}
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
