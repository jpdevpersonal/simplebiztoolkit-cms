type Props = { items: string[] };

export default function TrustBar({ items }: Props) {
  return (
    <div className="sb-trust-list" aria-label="Customer trust highlights">
      {items.map((item) => (
        <span key={item} className="sb-trust-pill">
          <span className="sb-trust-icon" aria-hidden="true">
            ✓
          </span>
          {item}
        </span>
      ))}
    </div>
  );
}
