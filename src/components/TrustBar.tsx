type Props = { items: string[] };

export default function TrustBar({ items }: Props) {
  return (
    <div className="d-flex flex-wrap gap-2 justify-content-center">
      {items.map((t) => (
        <span key={t} className="sb-trust-pill">
          <span style={{ fontSize: "0.875em" }}>⭐</span>
          {t}
        </span>
      ))}
    </div>
  );
}
