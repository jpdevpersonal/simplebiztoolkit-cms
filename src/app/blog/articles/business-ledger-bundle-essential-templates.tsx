import {
  Section,
  Callout,
  ArticleFooter,
} from "@/components/ArticleComponents";
import { ArticleCTA } from "@/components/ArticleCTA";

const ETSY_BUNDLE_URL =
  "https://www.etsy.com/listing/1805181510/business-ledger-templates-accounting";

export default function BusinessLedgerBundleContent() {
  return (
    <>
      <Section>
        <p>
          Running a small business has a funny way of turning sensible people
          into accidental accountants. One minute you're selling, creating,
          shipping, or serving clients. The next minute you're hunting through
          emails for invoices, wondering where last month's cash went, and
          promising yourself you'll "sort the books later."
        </p>
        <p>Later, of course, arrives at tax time with a megaphone.</p>
      </Section>

      <Section>
        <h2>Why most small businesses struggle with bookkeeping</h2>
        <p>
          Let's tell it like it is. Most small businesses don't fail because
          they lack passion or skill. They struggle because admin quietly piles
          up in the background.
        </p>
        <p>
          Receipts drift into drawers. Cash expenses go unlogged. Bills get paid
          but never written down. When you finally try to answer basic
          questions: How much did I actually make? Where did it go? What's my
          real profit? — the numbers don't line up.
        </p>
        <p>
          Accounting software can help, but it's often overkill at the early or
          micro-business stage. Subscriptions add up. Interfaces are complex.
          And if you don't use them consistently, they're just as useless as a
          shoebox full of receipts.
        </p>

        <Callout title="What small businesses really need is simple consistency">
          You don't need complicated accounting software on day one. You need a
          simple, consistent system. Something you'll actually use week after
          week.
        </Callout>
      </Section>

      <Section>
        <h2>What's included in the Business Ledger Bundle?</h2>
        <p>
          This bundle brings together eight essential templates that work as a
          unified admin toolkit. Each one solves a specific problem, but
          together they form a complete picture of your business finances.
        </p>

        <h3>1. Accounting ledgers (printable & fillable)</h3>
        <p>
          These are the backbone of the system. You record money coming in,
          money going out, and your running balance. No complicated categories
          unless you want them. Just clear columns that show exactly where you
          stand.
        </p>

        <h3>2. Petty cash log</h3>
        <p>
          Small cash expenses are the easiest money to lose track of. Coffee for
          a meeting, parking, postage, supplies. This log creates a clean audit
          trail so your cash always reconciles instead of mysteriously
          shrinking.
        </p>

        <h3>3. Bill payment tracker</h3>
        <p>
          Missed bills aren't just annoying — they're expensive. Late fees,
          service interruptions, stress. This tracker shows what's due, what's
          paid, and what's coming up, all on one page.
        </p>

        <h3>4. Invoice template</h3>
        <p>
          A clean, professional invoice you can print and use immediately. No
          design work required. Consistent invoices also mean fewer payment
          delays because clients know exactly what they're paying for.
        </p>

        <h3>5. Receipt template</h3>
        <p>
          Receipts matter more than people think. They protect you during
          disputes, refunds, and audits. This template keeps your customer
          records tidy and professional.
        </p>

        <h3>6. Order form</h3>
        <p>
          Perfect for custom orders, phone orders, market stalls, or manual
          sales. One clear place to capture what was ordered, by whom, and for
          how much.
        </p>

        <h3>7. Order tracker / sales log</h3>
        <p>
          This is your operational memory. What's been ordered, fulfilled,
          shipped, or completed. When customers ask, you don't guess — you
          check.
        </p>

        <h3>8. Time sheet</h3>
        <p>
          If you have staff, contractors, or even just want to understand where
          your own time goes, this template keeps hours visible and defensible.
        </p>

        <p>
          All templates are digital downloads, ready to print as many times as
          you need or use in fillable form where provided. No expiry. No
          software lock-in.
        </p>
      </Section>

      <Section>
        <h2>The real benefit: clarity, not complexity</h2>
        <p>
          The biggest advantage of this bundle isn't the individual templates.
          It's the consistency. Everything matches. Layouts make sense together.
          Once you learn one form, the rest feel familiar.
        </p>
        <p>
          That matters more than it sounds. Consistency reduces friction.
          Reduced friction means you actually keep records up to date. And
          up-to-date records mean fewer surprises.
        </p>

        <Callout title="The four questions every business owner should answer">
          At the end of the month, you should be able to answer four questions
          without panic: How much did I sell? How much did I spend? What fees or
          costs ate into revenue? What was my actual profit?
        </Callout>

        <p>
          This bundle is designed to make those answers obvious, not
          theoretical.
        </p>
      </Section>

      <Section>
        <h2>Who this bundle is ideal for</h2>
        <p>This system works especially well for:</p>
        <ul>
          <li>Sole traders and freelancers</li>
          <li>Etsy sellers and online shops</li>
          <li>Market stall and craft business owners</li>
          <li>Service providers and consultants</li>
          <li>Small teams who don't need full accounting software yet</li>
        </ul>
        <p>
          If you've ever thought "I just want something simple that works", this
          bundle is speaking directly to you.
        </p>
      </Section>

      <Section>
        <h2>Printable vs software: an honest comparison</h2>
        <p>
          There's a quiet advantage to printable or fillable templates that
          rarely gets mentioned: they slow you down just enough to notice
          patterns.
        </p>
        <p>
          When you write or type each transaction, you start seeing where money
          leaks out. You notice fees. You notice repeat expenses. You notice
          when sales dip. Software can hide this behind dashboards. Paper (or
          simple PDFs) makes it visible.
        </p>
        <p>
          This bundle doesn't replace professional accounting if you need it. It
          complements it. Many accountants actually prefer clean, simple ledgers
          over exports from half-used software accounts.
        </p>
      </Section>

      <Section>
        <h2>Cost-effective and future-proof</h2>
        <p>
          Buying these templates individually would cost more. The bundle saves
          money upfront and avoids ongoing subscription fees entirely.
        </p>
        <p>
          Print them this year. Print them next year. Duplicate files. Adapt
          them to your workflow.
        </p>
        <p>
          That's rare value in a world that increasingly rents you tools instead
          of letting you own them.
        </p>
      </Section>

      <ArticleCTA
        title="Simple tools. Clean numbers. Fewer headaches."
        description="This bundle won't magically run your business for you. What it will do is give you a calm, reliable system that turns financial chaos into something you can understand at a glance. And that understanding is power — the quiet, boring kind that keeps businesses alive."
        primaryLabel="Get the Business Ledger Bundle"
        primaryHref={ETSY_BUNDLE_URL}
        showHomeLink={true}
      />

      <ArticleFooter />
    </>
  );
}
