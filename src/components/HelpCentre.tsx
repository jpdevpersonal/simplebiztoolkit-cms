import Link from "next/link";
import type { HelpTopic } from "@/lib/helpTopics";
import { links } from "@/config/links";

const iconPaths: Record<string, string> = {
  download: "M12 3v12m0 0-4-4m4 4 4-4M5 21h14",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h4",
  printer: "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
  tablet: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 15h2",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01",
};

/** Most specific keywords first. */
const iconRules: Array<[RegExp, keyof typeof iconPaths]> = [
  [/guest|email/i, "mail"],
  [/grey|gray|processing|wait/i, "clock"],
  [/not start|doesn.t start|does not start|won.t/i, "refresh"],
  [/cannot find|can.t find|missing|find the order/i, "search"],
  [/print/i, "printer"],
  [/digital|tablet|goodnotes|ipad/i, "tablet"],
  [/open|file|pdf/i, "file"],
  [/still stuck|contact|message/i, "chat"],
  [/download|find/i, "download"],
];

function TopicIcon({ title }: { title: string }) {
  const key = iconRules.find(([re]) => re.test(title))?.[1] ?? "help";
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[key]} />
    </svg>
  );
}

export function HelpHero({
  title,
  subtitle,
  topics,
}: {
  title: string;
  subtitle?: string | null;
  topics: HelpTopic[];
}) {
  return (
    <header className="help-hero">
      <span className="help-hero-wave" aria-hidden="true">
        👋
      </span>
      <span className="sb-section-eyebrow">Help centre</span>
      <h1 className="help-hero-title">{title}</h1>
      <p className="help-hero-subtitle">
        {subtitle ||
          "Hi there! Find quick, friendly answers about downloading, opening and printing your templates."}
      </p>

      {topics.length > 0 && (
        <nav className="help-topics" aria-label="Help topics">
          <p className="help-topics-label">Choose a topic</p>
          <ul>
            {topics.map((topic) => (
              <li key={topic.id}>
                <a href={`#${topic.id}`} className="help-topic">
                  <span className="help-topic-icon">
                    <TopicIcon title={topic.title} />
                  </span>
                  <span className="help-topic-title">{topic.title}</span>
                  <svg
                    className="help-topic-arrow"
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
      )}
    </header>
  );
}

export function HelpContactPanel() {
  return (
    <section className="help-contact" aria-labelledby="help-contact-heading">
      <div className="help-contact-intro">
        <h2 id="help-contact-heading">Still need a hand?</h2>
        <p>
          We&apos;re a small business and happy to help. Get in touch and
          we&apos;ll sort it out with you.
        </p>
      </div>
      <div className="help-contact-options">
        <a
          className="help-contact-card"
          href={links.etsyShopUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="help-topic-icon">
            <TopicIcon title="message" />
          </span>
          <span>
            <strong>Order or download problem?</strong>
            <span>Message us on Etsy with your order details</span>
          </span>
        </a>
        <Link className="help-contact-card" href="/contact">
          <span className="help-topic-icon">
            <TopicIcon title="email" />
          </span>
          <span>
            <strong>Anything else?</strong>
            <span>Send us a message on the contact page</span>
          </span>
        </Link>
        <Link className="help-contact-card" href="/faq">
          <span className="help-topic-icon">
            <TopicIcon title="help" />
          </span>
          <span>
            <strong>Quick questions</strong>
            <span>Browse the frequently asked questions</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
