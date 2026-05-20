/* =============================================================================
   Simple Biz Toolkit — SEO content updates (en-GB)
   File: Documentation/seo-content-updates.sql
   Branch: experiment-improve-SEO-content

   Purpose
   -------
   Refreshes Category summaries and "how this helps" copy with
   keyword-rich, en-GB (organised, fulfilment, colour, optimise) text that
   matches the new on-site content. Provides a worked example for refreshing
   Product copy in the same style.

   Scope & safety
   --------------
     * UPDATEs only. No schema, constraints, indexes, or DDL changes.
     * No deletes, no inserts.
     * Every UPDATE is keyed on the slug, which is stable.
     * Each statement is wrapped in BEGIN TRAN / SELECT-for-review / COMMIT|
       ROLLBACK so the operator can preview each change before committing.
     * Apply on dev first, regenerate the public pages cache (ISR
       revalidation runs every 5 minutes — or call the revalidation route),
       and proof-read the public site before applying to production.

   Rollback
   --------
   No backup is taken automatically. Before running on production, capture
   the original rows to a CSV:

       :OUT current-categories-backup.csv
       SELECT Slug, Name, Summary, HowThisHelps FROM Categories ORDER BY Slug;
       :OUT stdout
       SELECT Slug, Title, Problem, [Description], Bullets FROM Products ORDER BY Slug;

   If a copy change needs to be reverted, restore the original Summary /
   HowThisHelps / Problem / Description value from the backup file.

   Style conventions
   -----------------
     * en-GB spelling: organised, fulfilment, colour, customise, optimise.
     * Avoid em-dashes in stored copy where simple punctuation works.
     * Summary ~ 140 to 200 characters; HowThisHelps ~ 220 to 320 characters.
     * Mention the buyer (small business owner, online seller, freelancer,
       landlord) and the deliverable (printable PDF, A4 / US Letter, fillable
       PDF) at least once per category.
============================================================================= */

SET NOCOUNT ON;

/* ----------------------------------------------------------------------------
   1. Categories.Summary and Categories.HowThisHelps
   ---------------------------------------------------------------------------- */

BEGIN TRAN UpdateCategories;

UPDATE Categories SET
    Summary = N'Printable accounting ledger templates for small business bookkeeping. Track income, expenses and running balances on A4 or US Letter PDFs that print or fill in cleanly.',
    HowThisHelps = N'Keeps your finances organised in one place so you can see income, expenses and balances at a glance. Useful for monthly bookkeeping, tax preparation, budgeting and staying in control of cash flow without paying for accounting software.'
WHERE Slug = 'accounting-ledger';

UPDATE Categories SET
    Summary = N'Printable attendance sheets for schools, clubs, events and workplaces. Choose monthly, event or roll-call layouts in A4 or US Letter.',
    HowThisHelps = N'Provides a clear, dated record of who attended and when. Useful for safeguarding, compliance, staff scheduling, classroom registers, training sign-offs and keeping events organised with a tidy paper trail you can file or scan.'
WHERE Slug = 'attendance-record';

UPDATE Categories SET
    Summary = N'Printable business ledger bundles that combine the core admin templates: accounting, orders, payments and cash. One coordinated set of PDFs.',
    HowThisHelps = N'Gives you a ready-made admin system with matching templates. Records stay consistent across money in, money out and day-to-day operations, so your bookkeeping, customer paperwork and cash records all line up at month end.'
WHERE Slug = 'business-ledger-bundles';

UPDATE Categories SET
    Summary = N'Printable estimate and quote templates for small businesses and tradespeople. Fillable and print-and-write PDFs in A4 and US Letter.',
    HowThisHelps = N'Helps you send clear, professional quotes that reduce back-and-forth, set expectations early and improve your chances of winning work at the right price. Type into the fillable PDF on a computer or print and hand-write on the job.'
WHERE Slug = 'estimates';

UPDATE Categories SET
    Summary = N'Printable expense and spending trackers for small businesses, freelancers and households. Simple monthly and weekly income vs expense PDFs.',
    HowThisHelps = N'Turns day-to-day spending into simple numbers you can act on. Spot overspend early, price your products and services smarter, separate business and personal money, and keep your profit margin healthier without using accounting apps.'
WHERE Slug = 'expense-and-spending';

UPDATE Categories SET
    Summary = N'Short, practical guides for small business owners — including our AI for Small Business Owners guide. Plain-English PDFs you can read in one sitting.',
    HowThisHelps = N'Gives you clear, step-by-step advice you can apply immediately. Less time guessing, faster decisions, and concrete examples of how to use modern tools (including AI) to save admin time and grow a small business.'
WHERE Slug = 'guides';

UPDATE Categories SET
    Summary = N'Printable minimalist invoice templates for small businesses and freelancers. Print-and-write or fillable PDFs in A4 and US Letter.',
    HowThisHelps = N'Makes billing straightforward and consistent so you get paid faster, reduce errors and keep customer-facing paperwork looking professional. Reusable forever with no subscription, no design software and no monthly fee.'
WHERE Slug = 'invoices';

UPDATE Categories SET
    Summary = N'Printable meeting notes templates with agenda, attendees and action items. Editable Word and print-and-write PDF formats included.',
    HowThisHelps = N'Captures decisions, actions and next steps in one consistent format so nothing falls through the cracks. Faster follow-ups, clearer accountability and a written record you can email or file after every client or team meeting.'
WHERE Slug = 'meeting-notes';

UPDATE Categories SET
    Summary = N'Printable order forms and order trackers for online sellers and small shops. Capture customer details, items, totals and fulfilment status.',
    HowThisHelps = N'Keeps orders and fulfilment organised from sale to delivery. Reduces mistakes, saves time on packing and shipping days, and gives you a customer order history you can reference when handling returns or repeat business.'
WHERE Slug = 'order-forms-and-trackers';

UPDATE Categories SET
    Summary = N'Printable payment trackers for client fees, bills and invoices. Log what is due, what is paid and what is overdue on a simple A4 or US Letter PDF.',
    HowThisHelps = N'Helps you avoid missed payments and awkward follow-ups by showing what is due, what is paid and what is overdue at a glance. Improves cash flow, reduces admin time and gives you a clean record for tax and bookkeeping.'
WHERE Slug = 'payment-tracker';

UPDATE Categories SET
    Summary = N'Printable petty cash logs for small businesses and shops. Auto-calculating fillable PDFs and print-and-write A4 or US Letter sheets.',
    HowThisHelps = N'Creates a clean audit trail for small cash transactions so your tills and floats reconcile. Stops "mystery" cash leakage, supports your bookkeeping, and gives every cash-in or cash-out entry a date, reason and balance.'
WHERE Slug = 'petty-cash';

UPDATE Categories SET
    Summary = N'Printable receipt templates in multiple colours and sizes. A4, US Letter, A5 and half-letter PDFs for cash, services and product sales.',
    HowThisHelps = N'Lets you issue professional-looking receipts quickly, improving customer trust and giving you cleaner records for bookkeeping, returns and tax. Reusable forever and easy to brand by writing or typing in your business name.'
WHERE Slug = 'receipts';

UPDATE Categories SET
    Summary = N'Printable rent payment ledgers for landlords and lettings agents. Monthly tenant payment logs in printable and fillable PDF formats.',
    HowThisHelps = N'Makes it easy to document rent due, paid and outstanding by tenant and date. Gives landlords a clear paper trail that supports smoother property management, fewer disputes and tidy records at the end of the tax year.'
WHERE Slug = 'rent-payment-ledger';

UPDATE Categories SET
    Summary = N'Printable sign-in sheets for reception, visitors, events, workshops and classes. A4 and US Letter PDFs that print cleanly on any printer.',
    HowThisHelps = N'Speeds up check-ins and visitor logs while keeping accurate records. Useful for reception desks, workshops, training events, fitness classes and basic visitor security or fire-roll-call procedures.'
WHERE Slug = 'sign-in-sheets';

UPDATE Categories SET
    Summary = N'Printable time sheets and time trackers for employees, contractors and freelancers. Weekly, daily and editable Excel formats.',
    HowThisHelps = N'Captures hours worked consistently so you can bill clients accurately, run payroll confidently and understand where time is actually going. Includes breaks, daily totals and weekly totals to suit hourly and project-based work.'
WHERE Slug = 'time-sheet';

UPDATE Categories SET
    Summary = N'Printable tips and service trackers for hospitality, salon and service staff. Daily tip logs and editable Excel versions.',
    HowThisHelps = N'Tracks tips and service income cleanly so staff payouts are fair, reporting is easier, and you have better visibility on weekly and monthly earnings. Handy at tax time and for splitting tips across shifts or roles.'
WHERE Slug = 'tips-and-service';

/* Review the result before committing: */
SELECT Slug, LEN(Summary) AS SummaryLen, LEN(HowThisHelps) AS HelpLen
FROM Categories
ORDER BY Slug;

/* If everything looks good, COMMIT. Otherwise ROLLBACK and adjust. */
-- COMMIT TRAN UpdateCategories;
-- ROLLBACK TRAN UpdateCategories;


/* ----------------------------------------------------------------------------
   2. Products — worked example
   ----------------------------------------------------------------------------
   The Products table contains 42 published rows. Updating every one would
   make this file unwieldy and would require manual phrasing for each
   product. The block below shows the recommended pattern using two
   high-traffic listings as a worked example. Copy the pattern for the rest
   when time allows.

   Conventions for Products copy:
     * Problem (140 to 220 chars): one sentence stating the buyer's pain plus
       one sentence describing the template's job. en-GB spelling.
     * Description (300 to 700 chars HTML or plain): expand the problem
       statement with a short "what's in the file" paragraph. Mention A4 and
       US Letter, PDF, fillable or print-and-write, and the buyer.
     * Bullets (JSON array stored as NVARCHAR): 4 to 7 bullets each starting
       with a capitalised noun phrase ("Fillable PDF", "A4 and US Letter
       sizes", "Auto-calculating totals", "Instant download via Etsy").

   Apply selectively and proof-read the public product page after each
   change. Update Bullets only after confirming the current format
   (some columns store JSON arrays, some store newline-delimited strings).
*/

BEGIN TRAN UpdateProductsExample;

UPDATE Products SET
    Problem = N'You need a clean, printable accounting ledger to track income, expenses and running balances without paying for accounting software. This general ledger set gives you six colour-coded PDF sheets that print cleanly on A4 or US Letter and let you record every transaction by date, description, debit, credit and balance.'
WHERE Slug = 'accounting-ledger-general-ledger-sheets-6-colors';

UPDATE Products SET
    Problem = N'Landlords need a simple, printable rent payment ledger that records each tenant''s monthly rent, payment date and outstanding balance. This printable rent payment ledger gives you a clean A4 or US Letter PDF that you can print and complete by hand at the end of every month, then file or scan for your records.'
WHERE Slug = 'printable-rent-payment-ledger';

/* Preview: */
SELECT Slug, LEN(Problem) AS ProblemLen
FROM Products
WHERE Slug IN (
    'accounting-ledger-general-ledger-sheets-6-colors',
    'printable-rent-payment-ledger'
);

-- COMMIT TRAN UpdateProductsExample;
-- ROLLBACK TRAN UpdateProductsExample;


/* ----------------------------------------------------------------------------
   3. MenuItemPages (CMS pages) — guidance only
   ----------------------------------------------------------------------------
   MenuItemPages.SeoTitle and MenuItemPages.SeoDescription are surfaced in
   the Article schema and meta tags generated by src/app/(public)/[slug]/page.tsx.
   When refreshing copy for a specific CMS page, prefer editing it through
   the Admin -> Pages UI so the editor's HTML normalisation runs. Only fall
   back to direct SQL when the page is locked or out of reach of the editor.

   Reference template (replace placeholders before running):

     UPDATE MenuItemPages
     SET SeoTitle       = N'<60-char Title with primary keyword>',
         SeoDescription = N'<150-160 chars buyer-intent meta description, en-GB>'
     WHERE Slug = N'<page-slug>';

   Do not edit the Content column with SQL — use the admin editor.
*/


/* End of file. */
