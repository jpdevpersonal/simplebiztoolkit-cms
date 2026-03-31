type Props = { items: string[] };

const trustIcons: Record<string, string> = {
  "Five Star Etsy rating": "⭐",
  "Etsy Star Seller!": "🏆",
  "Over 3500 sales": "📈",
  "Secure checkout via Etsy": "🔒",
  "Excellent service & support": "💬",
};

export default function TrustBar({ items }: Props) {
  return (
    <div className="d-flex flex-wrap gap-2 justify-content-center">
      {items.map((t) => (
        <span key={t} className="sb-trust-pill">
          <span style={{ fontSize: "0.9em", lineHeight: 1 }}>
            {trustIcons[t] ?? "⭐"}
          </span>
          {t}
        </span>
      ))}
    </div>
  );
}
