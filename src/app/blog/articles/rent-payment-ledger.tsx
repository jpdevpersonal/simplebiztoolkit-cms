import Link from "next/link";
import {
  Section,
  Callout,
  ArticleFooter,
} from "@/components/ArticleComponents";
import { ArticleCTA } from "@/components/ArticleCTA";

const AFFILIATE_URL =
  "https://www.etsy.com/uk/listing/1273225049/rent-payment-ledger-printable-rent"; // TODO: replace with actual Etsy listing URL

export default function RentPaymentLedgerContent() {
  return (
    <>
      <Section>
        <p>
          Managing rent payments should be routine, not stressful. Yet for
          landlords, tenants, and small business owners alike, rent tracking
          often becomes fragmented across bank statements, emails, screenshots,
          and memory. When questions arise — Was rent paid? Was it late? Was it
          short? — the lack of a clear record creates unnecessary friction.
        </p>
        <p>
          A Rent Payment Ledger solves this problem by providing one clear,
          consistent record of rent activity. No subscriptions. No dashboards.
          No complexity. Just a reliable paper trail that protects everyone
          involved.
        </p>
        <p>
          This article explains why rent tracking fails, who benefits from a
          ledger, and why simple systems outperform expensive
          software—especially for small-scale property management and business
          use.
        </p>
      </Section>

      <Section>
        <h2>Why rent tracking breaks down so easily</h2>
        <p>
          Rent is predictable. The same amount, due on the same date, every
          month. Ironically, that predictability is why many people skip setting
          up a proper system.
        </p>

        <p>Problems usually surface when something deviates from the norm:</p>
        <ul>
          <li>A late or partial payment</li>
          <li>A bank transfer made on the wrong date</li>
          <li>A disputed month</li>
          <li>A change in rent amount</li>
          <li>A tenant or landlord relying on memory instead of records</li>
        </ul>

        <p>
          At that point, resolving the issue means scrolling through banking
          apps, searching emails, or reconstructing timelines from fragments.
          This is inefficient and avoidable.
        </p>

        <Callout title="Single source of truth">
          A rent payment ledger prevents confusion by creating a clear, shared
          reference that removes ambiguity for everyone involved.
        </Callout>
      </Section>

      <Section>
        <h2>How landlords benefit</h2>
        <p>
          For landlords, clarity is not optional. Whether managing one property
          or several, you need records that are easy to review, explain, and
          defend.
        </p>

        <ul>
          <li>Record each payment by date, amount, and method</li>
          <li>Instantly identify late, missed, or partial payments</li>
          <li>Maintain a month-by-month payment history</li>
          <li>Prepare clean records for tax reporting or accountants</li>
          <li>Handle disputes calmly with documented facts</li>
        </ul>

        <p>
          Unlike full property-management software, a ledger stays focused on
          what actually matters: no learning curve, no monthly fee, and no
          reliance on third-party platforms.
        </p>
      </Section>

      <Section>
        <h2>Why tenants should keep their own records</h2>
        <p>
          Tenants benefit just as much from maintaining a clear payment history.
          A ledger helps tenants prove rent was paid on time, avoid disputes,
          build a documented rental history, and support future applications.
        </p>
        <ul>
          <li>Prove payments were made, on time and in full</li>
          <li>Avoid disputes caused by unclear records</li>
          <li>Build a documented rental history for references</li>
          <li>Stay organised for budgeting and planning</li>
        </ul>
      </Section>

      <Section>
        <h2>Small business owners: this helps you too</h2>
        <p>
          Small business owners often wear multiple hats, including property
          manager. Whether you rent office space, sublet rooms, or manage shared
          facilities, rent tracking still matters and a ledger fits naturally
          into a wider admin system.
        </p>
        <ul>
          <li>Clear outgoing expense tracking</li>
          <li>Support for cash flow planning</li>
          <li>Documentation for accountants or audits</li>
          <li>Reduced admin time</li>
        </ul>

        <p>
          Recommended pairing:
          <br />
          <Link href="#" className="article-cta-btn article-cta-btn-secondary">
            Monthly Business Ledger
          </Link>
          <span style={{ marginLeft: 8 }} />
          <Link href="#" className="article-cta-btn article-cta-btn-secondary">
            Expense &amp; Cash Flow Tracker
          </Link>
        </p>
      </Section>

      <Section>
        <h2>Why simple systems outperform expensive software</h2>
        <p>
          There is a persistent belief that organisation requires software
          subscriptions. In reality, most people do not need dashboards or
          automation — they need clarity. A rent payment ledger offers a
          one-time purchase, works on paper or digitally, and gives you full
          control of your data.
        </p>

        <Callout title="No subscriptions required">
          You buy it once and use it for years. Immediate usability, no
          accounts, and no recurring fees.
        </Callout>
      </Section>

      <Section>
        <h2>What makes a good rent payment ledger</h2>
        <p>
          A useful ledger must be clearly laid out, easy to read at a glance,
          spacious enough for notes, and free of unnecessary clutter. A
          well-designed ledger becomes part of your routine — you stop thinking
          about it because it simply works.
        </p>

        <div>
          See an example:
          <div style={{ margin: "1rem 0" }}>
            <Link
              href="/products/rent-payment-ledger"
              className="article-cta-btn article-cta-btn-primary"
            >
              Printable Rent Payment Ledger
            </Link>
          </div>
        </div>
      </Section>

      <ArticleCTA
        title="Ready to make rent tracking effortless?"
        description="If you're tired of searching bank statements, second-guessing payment dates, or managing avoidable misunderstandings, this rent payment ledger is an affordable, practical improvement you can use from day one."
        primaryLabel="Get Your Rent Payment Ledger"
        primaryHref={AFFILIATE_URL}
        showHomeLink={false}
      />

      <ArticleFooter />
    </>
  );
}
