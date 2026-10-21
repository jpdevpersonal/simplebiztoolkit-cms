# Technical audit handoff

This change makes the confirmed frontend corrections in code. It does not
change production data, CMS records, Etsy listings, GA4, Search Console, DNS, or
CDN settings. Complete the checks below before treating the audit as fully
closed.

## Product and listing verification

- Compare every published product page with its current Etsy listing and the
  actual downloadable files. Confirm file formats, printability, fillable
  fields, supported applications, paper sizes, delivery, compatibility, and
  license terms. Enter only verified values in the product data source.
- Resolve the monthly-ledger CTA mismatch in the CSV profit calculator. Its
  label says “Monthly Accounting Ledger” but links to
  `/templates/accounting-ledger/printable-accounting-ledger-accounts-receivable`,
  while the referenced product content appears to describe a general
  income/expense ledger. Confirm which product the CTA should promote and
  update the link, label, and listing description together.
- Confirm the static customer quotations and names shown on the home and
  testimonials pages are authentic, current, and approved for publication.
- Compare Etsy listing prices and license terms with any site or CMS copy.
  Resolve contradictions at the listing/source-of-truth level rather than
  assuming a site-side generic statement is authoritative.
- Review CMS-managed article and CTA content for unverified format,
  compatibility, delivery, response-time, license, or Etsy-vs-other-platform
  fee comparisons. The repository cannot inspect or update remote CMS records.

## Product API/CMS migration proposal

The frontend accepts these optional product fields, but this repository does
not implement their CMS persistence or editor UI:

- `fileFormats`, `printable`, `fillable`
- `supportedApplications`, `paperSizes`
- `licenseDescription`, `licenseReference`
- `priceAmount`, `priceCurrency`

Add these fields additively to the product API/CMS model and editor, validate
them on write, and backfill only after checking each product's source files and
Etsy listing. Keep the existing display `price` separate until the CMS can
provide a verified numeric amount and ISO currency. The product schema
intentionally omits an Offer when that explicit numeric contract is absent.

## Unavailable free offer

The `/free` route is an unavailable, noindex placeholder and its acquisition
CTAs are disabled. Before re-enabling it, verify the real offer and file,
configure a functioning consent-aware signup and delivery path, confirm
privacy/retention and unsubscribe requirements, and test the complete
signup-to-delivery journey. Do not enable the feature flag until that flow has
been tested end to end.

## Etsy calculator assumptions

The calculator uses official Etsy Help pages for transaction, payment
processing, regulatory operating, listing, and Offsite Ads fee references,
checked on 2026-10-21. The UK listing fee is an explicitly labeled converted
estimate. The displayed model applies percentage fees to item price plus
buyer-paid shipping, treats actual postage as a seller cost, and assumes one
item per order. It does not model buyer taxes, VAT on fees, currency conversion,
Offsite Ads caps, refunds, multi-item listing renewals, or every possible
seller charge. Recheck rates and assumptions against Etsy Help before
publishing future changes.

## Production and platform checks

- **GA4:** Confirm the measurement ID belongs to the intended property; verify
  page views during client navigation and the `tool_complete` / `file_export`
  events in DebugView or Realtime. Confirm consent behavior, enhanced
  measurement page-view settings, and exclusion of private routes in the live
  property. This code-level verification does not establish production data
  ingestion.
- **Search Console:** Verify the property, sitemap fetch/indexing status,
  canonical selections, and coverage of the intended public routes. Review
  redirects and crawler access before changing any legacy route.
- **Structured data:** Test representative public pages with Google's Rich
  Results Test and inspect Search Console enhancements. Product Offer data
  requires verified numeric price and currency. The site does not emit
  Organization aggregate ratings or review snippets; Google's self-serving
  review policy applies to Organization and LocalBusiness markup:
  https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- **URLs and sitemap:** Check production redirects, canonicals, sitemap
  contents, and `robots.txt` against the deployed CMS content and CDN rules.
  Legacy promotional routes were not redirected without evidence that doing
  so is appropriate.
- **Performance:** Measure representative production routes and assets on
  mobile and desktop, including CDN caching, image delivery, and Core Web
  Vitals. No production performance measurement was performed as part of this
  code change.
