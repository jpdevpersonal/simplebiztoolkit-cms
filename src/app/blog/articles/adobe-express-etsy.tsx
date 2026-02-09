import {
  Section,
  Callout,
  ArticleFooter,
} from "@/components/ArticleComponents";
import { ArticleCTA } from "@/components/ArticleCTA";

const AFFILIATE_URL = "https://www.adobe.com/uk/express"; // TODO: replace

export default function AdobeExpressEtsyContent() {
  return (
    <>
      <Section>
        <h2>Polish your product photos effortlessly</h2>
        <p>
          Your listing images are your shop window. If they look cluttered, dim,
          or inconsistent, buyers subconsciously downgrade trust — and keep
          scrolling. Adobe Express includes quick, beginner-friendly photo
          actions that cover the stuff Etsy sellers actually need:
        </p>
        <ul>
          <li>Remove or replace backgrounds to keep focus on the product.</li>
          <li>Crop and resize fast (and consistently) across your listings.</li>
          <li>
            Adjust brightness, contrast, and colour to make images look clean
            and intentional.
          </li>
          <li>Apply simple filters/presets so your whole shop "matches".</li>
        </ul>
        <p>
          If you sell printables, you can do the classic move: clean mockups on
          a tidy backdrop (desk scene, wall frame, clipboard) so buyers
          instantly "get it" without squinting.
        </p>

        <Callout title="Practical win: consistency beats complexity">
          A simple, repeatable style for listing images usually converts better
          than "fancy but random". Think: same lighting, similar spacing, same
          font choices, same layout logic.
        </Callout>
      </Section>

      <Section>
        <h2>Build a cohesive brand with branded templates</h2>
        <p>
          Branding isn't just a logo — it's repetition. When your banner,
          listing images, Instagram posts, and Pinterest pins look like they
          belong to the same shop, you get recognition (and recognition leads to
          trust).
        </p>
        <p>
          Adobe Express helps by giving you templates (including Etsy-friendly
          ones) and a <strong>Brand Kit</strong> approach: drop in your logo,
          choose your brand colours and fonts once, then apply them across
          designs without redoing everything manually.
        </p>
        <ul>
          <li>Keep the same fonts and colours across every graphic.</li>
          <li>
            Reuse layouts so you're not reinventing your design each time.
          </li>
          <li>Turn "I should post something" into "Done in 10 minutes".</li>
        </ul>
      </Section>

      <Section>
        <h2>
          Create social media content in minutes (and stop resizing things
          manually)
        </h2>
        <p>
          Social media drives traffic, but the format chaos is real: squares,
          portraits, stories, pins… and each platform wants something different.
          Adobe Express makes it easier to produce one "core" design and
          generate versions for different sizes.
        </p>

        <h3>What to make (that actually drives clicks)</h3>
        <ul>
          <li>
            <strong>New listing pins (Pinterest):</strong> title + mockup + 2–3
            benefits.
          </li>
          <li>
            <strong>Before/after visuals:</strong> "messy tracking → clean
            tracking" (especially for finance templates).
          </li>
          <li>
            <strong>Mini tutorials:</strong> 3 steps to use the template (people
            save these posts).
          </li>
          <li>
            <strong>Seasonal reminders:</strong> tax season, end-of-month
            bookkeeping, rental cycles, etc.
          </li>
        </ul>

        <p>
          Express also supports light video/animation (simple motion text, quick
          promo clips). You're not trying to win an Oscar — you're trying to
          stop thumbs from doomscrolling past your product.
        </p>

        <Callout title="If you're premium: scheduling is the real cheat code">
          If you use the scheduler, you can batch-create a week of posts in one
          sitting and stop interrupting your day to post manually.
        </Callout>
      </Section>

      <Section>
        <h2>Design all your marketing materials in one place</h2>
        <p>
          Etsy sellers end up needing more than listing images: thank-you cards,
          coupons, instruction sheets, business cards, quick flyers for fairs…
          Adobe Express is built for that "small biz marketing buffet".
        </p>
        <ul>
          <li>
            Thank-you cards and inserts (especially useful for digital downloads
            too).
          </li>
          <li>Coupon graphics you can include in PDFs or share on social.</li>
          <li>Simple flyers/posters for local events.</li>
          <li>Brand-consistent headers, banners, and promos.</li>
        </ul>
        <p>
          The built-in asset libraries (photos/icons/fonts) also reduce "where
          do I legally find an image for this?" anxiety. Less hunting, more
          shipping.
        </p>
      </Section>

      <Section>
        <h2>Save time, stay consistent, and focus on the actual business</h2>
        <p>
          The real benefit is boring and powerful: you spend less time fighting
          tools and more time doing what moves the needle — building products,
          improving listings, serving customers, and marketing with consistency.
        </p>
        <p>
          Adobe Express has a free plan (useful for essentials), and paid
          features unlock bigger convenience wins (like scheduling and expanded
          assets). The sensible approach is: start with free, prove it saves
          time, then upgrade only if it's earning its keep.
        </p>
      </Section>

      <Section>
        <h2>A simple workflow Etsy sellers can copy</h2>
        <ol>
          <li>
            Create 1–2 listing image templates (headline + mockup + 3 benefits +
            footer branding).
          </li>
          <li>
            Make a reusable "New Product" post template for Instagram +
            Pinterest.
          </li>
          <li>Batch-produce assets for your next 5 listings in one session.</li>
          <li>Schedule posts (or at least export platform sizes in one go).</li>
          <li>
            Reuse the same system every time (this is the part most people
            skip).
          </li>
        </ol>
      </Section>

      <ArticleCTA
        title="Try Adobe Express (without the design headache)"
        description="If your shop visuals are 'fine' but inconsistent (or painfully slow to produce), Adobe Express is a solid way to get faster, cleaner, and more on-brand — without becoming a full-time designer."
        primaryLabel="Explore Adobe Express"
        primaryHref={AFFILIATE_URL}
        showHomeLink={true}
        showEtsyLink={false}
      />

      <ArticleFooter />
    </>
  );
}
