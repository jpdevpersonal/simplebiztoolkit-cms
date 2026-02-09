export type Testimonial = {
  id: number;
  quote: string;
  name: string;
  role: string;
  productLink?: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "⭐⭐⭐⭐ Great stuff, super fast PDF dowwnload.",
    name: "Angie",
    role: "Buyer",
    productLink:
      "/products/time-sheet/printable-employee-time-sheet-hours-worked-weekly",
  },
  {
    id: 2,
    quote: "⭐⭐⭐⭐ Easy and convenient to download.",
    name: "Kristen",
    role: "Small business owner",
    productLink: "/products/rent-payment-ledger/printable-rent-payment-ledger",
  },
  {
    id: 3,
    quote:
      "⭐⭐⭐⭐ Just what I was looking for and had not been able to find any where else.  So glad I found these.",
    name: "Becky",
    role: "Etsy seller",
    productLink:
      "/products/accounting-ledger/accounting-ledger-general-ledger-sheets-6-colors",
  },
  {
    id: 4,
    quote:
      "⭐⭐⭐⭐ ..Just wanted something beautiful and clean that you can fill out yourslef.  Seller is very professional.",
    name: "Laura",
    role: "Buyer",
    productLink:
      "/products/accounting-ledger/fillable-printable-accounting-ledger-pdf",
  },
  {
    id: 5,
    quote:
      "⭐⭐⭐⭐ I love the way this has been set up to track exactly what has been payed and what is still owed. It is very helpful to have the running balance on each page as well. I have been using it for a few months now and it has been a great help in keeping my business organized.",
    name: "Diane",
    role: "Business owner",
    productLink:
      "products/payment-tracker/payment-tracker-client-payment-history-log",
  },
  {
    id: 6,
    quote: "⭐⭐⭐⭐ Very easy to download and use",
    name: "Audria",
    role: "Buyer",
    productLink:
      "/products/accounting-ledger/printable-monthly-accounting-ledger-start-end-balance",
  },
  {
    id: 7,
    quote: "⭐⭐⭐⭐ This is a great payment ledger",
    name: "Jordalina",
    role: "Buyer",
    productLink: "/products/rent-payment-ledger/printable-rent-payment-ledger",
  },
];
