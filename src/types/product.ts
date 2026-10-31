export type ProductCategory = {
  slug: string;
  name: string;
  summary: string;
  howThisHelps: string;
  heroImage: string;
  items: Array<{
    title: string;
    problem: string;
    description?: string;
    bullets: string[];
    image: string;
    etsyUrl: string;
    price: string;
    productPageUrl?: string;
    fileFormats?: ProductFileFormat[];
    printable?: boolean;
    fillable?: boolean;
    supportedApplications?: string[];
    paperSizes?: string[];
    priceAmount?: number;
    priceCurrency?: string;
    licenseDescription?: string;
    licenseReference?: string;
  }>;
};

export type Product = ProductCategory["items"][number];

export type ProductFileFormat = "PDF" | "Excel" | "Word" | "CSV" | "Other";
