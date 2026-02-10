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
  }>;
};

export type Product = ProductCategory["items"][number];
