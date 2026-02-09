import {
  Section,
  Callout,
  ArticleFooter,
} from "@/components/ArticleComponents";
import { ArticleCTA } from "@/components/ArticleCTA";

export default function EtsySellerFinancesContent() {
  return (
    <>
      <Section>
        <p>
          Etsy fees and payouts can feel like a fog machine. The goal is to make
          your numbers boring.
        </p>
        <p>
          When your finances are predictable and clear, you can actually focus
          on what matters: making great products and serving your customers.
        </p>
      </Section>

      <Section>
        <h2>What to track (and nothing more)</h2>
        <p>
          Keep it simple. Track these five things and you'll have clarity on
          your shop's real profitability:
        </p>
        <ul>
          <li>
            <strong>Gross sales:</strong> The total before Etsy takes their cut
          </li>
          <li>
            <strong>Etsy fees:</strong> Transaction fees, payment processing,
            listing fees
          </li>
          <li>
            <strong>Shipping costs:</strong> What you actually paid to ship
          </li>
          <li>
            <strong>Materials:</strong> Supplies, packaging, raw materials
          </li>
          <li>
            <strong>Profit:</strong> What's left after all the above
          </li>
        </ul>

        <Callout title="Weekly beats perfect">
          Don't try to track every single transaction in real-time. A weekly
          review is enough to stay on top of things without burning out.
        </Callout>
      </Section>

      <Section>
        <h2>Understanding Etsy's fee structure</h2>
        <p>Etsy takes a cut at multiple points:</p>
        <ul>
          <li>
            <strong>Listing fee:</strong> $0.20 per listing (renews every 4
            months or when sold)
          </li>
          <li>
            <strong>Transaction fee:</strong> 6.5% of the total sale price
            (including shipping)
          </li>
          <li>
            <strong>Payment processing:</strong> 3% + $0.25 per transaction
          </li>
          <li>
            <strong>Offsite ads (if applicable):</strong> 12-15% of sale if Etsy
            drives the traffic
          </li>
        </ul>
        <p>
          These fees add up. On a $20 item, you might pay $2-3 in fees. Knowing
          this upfront helps you price correctly.
        </p>
      </Section>

      <Section>
        <h2>A simple ledger keeps you sane</h2>
        <p>
          A simple ledger format keeps you out of analysis paralysis and gives
          you clean totals for tax time.
        </p>
        <p>
          At the end of each month, you should be able to answer these
          questions:
        </p>
        <ol>
          <li>How much did I sell?</li>
          <li>How much did I spend on materials and shipping?</li>
          <li>How much did Etsy take in fees?</li>
          <li>What was my actual profit?</li>
        </ol>
        <p>
          If you can answer those four questions, you're ahead of 90% of Etsy
          sellers.
        </p>
      </Section>

      <ArticleCTA
        showHomeLink={true}
        showEtsyLink={false}
        title="Track your Etsy finances"
        description="Get a access to time saving templates designed specifically for Etsy sellers to track fees, sales, and real profit."
      />

      <ArticleFooter />
    </>
  );
}
