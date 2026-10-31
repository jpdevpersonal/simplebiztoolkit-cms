import type { HelpTopic } from "@/lib/helpTopics";
import { links } from "@/config/links";
import { ActionPanel, PageHero, TopicCards } from "@/components/PageHero";

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
    <PageHero
      badge="👋"
      eyebrow="Help centre"
      title={title}
      intro={
        <p>
          {subtitle ||
            "Hi there! Find quick, friendly answers about downloading, opening and printing your templates."}
        </p>
      }
    >
      <TopicCards
        ariaLabel="Help topics"
        topics={topics.map((topic) => ({
          href: `#${topic.id}`,
          title: topic.title,
        }))}
      />
    </PageHero>
  );
}

export function HelpContactPanel() {
  return (
    <ActionPanel
      id="help-contact-heading"
      title="Still need a hand?"
      text="We're a small business and happy to help. Get in touch and we'll sort it out with you."
      options={[
        {
          href: links.etsyShopUrl,
          title: "Order or download problem?",
          text: "Message us on Etsy with your order details",
          icon: "chat",
          external: true,
          etsyPlacement: "help_contact_panel",
        },
        {
          href: "/contact",
          title: "Anything else?",
          text: "Send us a message on the contact page",
          icon: "mail",
        },
        {
          href: "/faq",
          title: "Quick questions",
          text: "Browse the frequently asked questions",
          icon: "help",
        },
      ]}
    />
  );
}
