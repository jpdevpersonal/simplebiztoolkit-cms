import BookkeepingBasicsContent from "./bookkeeping-made-simple";
import EtsySellerFinancesContent from "./etsy-seller-finances-in-one-place";
import AdobeExpressEtsyContent from "./adobe-express-etsy";
import RentPaymentLedgerContent from "./rent-payment-ledger";
import BusinessLedgerBundleContent from "./business-ledger-bundle-essential-templates";

interface ArticleContentProps {
  slug: string;
}

export function ArticleContent({ slug }: ArticleContentProps) {
  switch (slug) {
    case "bookkeeping-made-simple":
      return <BookkeepingBasicsContent />;
    case "etsy-seller-finances-in-one-place":
      return <EtsySellerFinancesContent />;
    case "adobe-express-etsy":
      return <AdobeExpressEtsyContent />;
    case "rent-payment-ledger":
      return <RentPaymentLedgerContent />;
    case "business-ledger-bundle-essential-templates":
      return <BusinessLedgerBundleContent />;
    default:
      return null;
  }
}

export function hasArticleContent(slug: string): boolean {
  return [
    "bookkeeping-made-simple",
    "etsy-seller-finances-in-one-place",
    "adobe-express-etsy",
    "rent-payment-ledger",
    "business-ledger-bundle-essential-templates",
  ].includes(slug);
}
