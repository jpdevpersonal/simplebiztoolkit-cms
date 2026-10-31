import type { ReactNode } from "react";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import PageIcon, { pickIconName, type PageIconName } from "@/components/PageIcon";
import type { PublicAnalyticsParams } from "@/lib/analytics";
import "@/styles/pageHero.css";

/** Friendly page header: icon badge, eyebrow, title, intro and extras. */
export function PageHero({
  badge,
  eyebrow,
  title,
  intro,
  meta,
  children,
}: {
  badge: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sb-page-hero">
      <span className="sb-page-hero-badge" aria-hidden="true">
        {badge}
      </span>
      <span className="sb-section-eyebrow">{eyebrow}</span>
      <h1 className="sb-page-hero-title">{title}</h1>
      {intro && <div className="sb-page-hero-intro">{intro}</div>}
      {meta && <p className="sb-page-hero-meta">{meta}</p>}
      {children}
    </header>
  );
}

/** Small "✓ benefit" pills shown inside a PageHero. */
export function HeroChips({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className="sb-page-hero-chips" aria-label={label}>
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export type TopicLink = {
  href: string;
  title: string;
  note?: string;
  icon?: PageIconName;
};

/** "Choose a topic" cards that jump to sections further down the page. */
export function TopicCards({
  topics,
  ariaLabel,
  label = "Choose a topic",
}: {
  topics: TopicLink[];
  ariaLabel: string;
  label?: string;
}) {
  if (topics.length === 0) return null;

  return (
    <nav className="sb-topics" aria-label={ariaLabel}>
      <p className="sb-topics-label">{label}</p>
      <ul>
        {topics.map((topic) => (
          <li key={topic.href}>
            <a href={topic.href} className="sb-topic">
              <span className="sb-topic-icon">
                <PageIcon name={topic.icon ?? pickIconName(topic.title)} />
              </span>
              <span className="sb-topic-copy">
                <span className="sb-topic-title">{topic.title}</span>
                {topic.note && (
                  <span className="sb-topic-note">{topic.note}</span>
                )}
              </span>
              <svg
                className="sb-topic-arrow"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 3v10M4 9l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export type ActionOption = {
  href: string;
  title: string;
  text: string;
  icon: PageIconName;
  external?: boolean;
  /** When set, clicks are tracked as an outbound Etsy click. */
  etsyPlacement?: string;
};

/** Closing "what next?" panel with a few option cards. */
export function ActionPanel({
  id,
  title,
  text,
  options,
}: {
  id: string;
  title: string;
  text: string;
  options: ActionOption[];
}) {
  return (
    <section className="sb-action-panel" aria-labelledby={id}>
      <div className="sb-action-panel-intro">
        <h2 id={id}>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="sb-action-panel-options">
        {options.map((option) => {
          const body = (
            <>
              <span className="sb-topic-icon">
                <PageIcon name={option.icon} />
              </span>
              <span>
                <strong>{option.title}</strong>
                <span>{option.text}</span>
              </span>
            </>
          );
          const external = option.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          if (option.etsyPlacement) {
            const eventParams: PublicAnalyticsParams = {
              placement: option.etsyPlacement,
              destination_type: "etsy",
            };
            return (
              <TrackedLink
                key={option.href + option.title}
                className="sb-action-card"
                href={option.href}
                eventName="outbound_etsy_click"
                eventParams={eventParams}
                {...external}
              >
                {body}
              </TrackedLink>
            );
          }

          return option.external ? (
            <a
              key={option.href + option.title}
              className="sb-action-card"
              href={option.href}
              {...external}
            >
              {body}
            </a>
          ) : (
            <Link
              key={option.href + option.title}
              className="sb-action-card"
              href={option.href}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
