export type CsvCalculatorFaq = {
  question: string;
  answer: string;
};

export const CSV_CALCULATOR_FAQS: CsvCalculatorFaq[] = [
  {
    question: "Is this Etsy profit calculator really free?",
    answer:
      "Yes. There is no sign-up, no credit card and no usage limit. The tool runs entirely in your browser and is free for Etsy sellers and other small business owners to use as often as you like.",
  },
  {
    question: "Where do I find my Etsy CSV file?",
    answer:
      "Sign in to Etsy, then go to Shop Manager → Finances → Payment account → Monthly statements. Choose the month you want and click Download CSV. You can upload up to 15 monthly CSVs at once and get a single combined profit report.",
  },
  {
    question: "Is my Etsy data uploaded anywhere?",
    answer:
      "No. Your CSV is parsed locally in your browser using JavaScript. It is never sent to a server and we do not store, log or see your data. You can verify this by disconnecting from the internet after the page loads — the tool will still work.",
  },
  {
    question: "What does the report include?",
    answer:
      "Each month you get total revenue, Etsy fees, refunds, adjustments and net received. You can also add packaging, shipping supplies, ads, subscriptions and other costs to estimate your real profit. Download as Excel or CSV to share with your accountant.",
  },
  {
    question: "Can I use this for taxes or bookkeeping?",
    answer:
      "The report gives you a clean monthly summary that is much easier to hand to a bookkeeper or accountant than the raw Etsy export. It is a reference summary, not professional advice — always confirm figures with a qualified accountant before filing taxes.",
  },
  {
    question: "Does it work for shops outside the US?",
    answer:
      "Yes. The tool detects the currency symbol used in your CSV (£, $ or €) and keeps it consistent throughout the report. It works for Etsy sellers in the UK, US, Canada, Australia, the EU and beyond.",
  },
  {
    question: "What if my CSV has unusual columns?",
    answer:
      "The tool auto-detects the standard Etsy columns for date, transaction type, amount, fee and net. If your export looks different, the tool will tell you which column is missing so you can re-export from Etsy and try again.",
  },
];
