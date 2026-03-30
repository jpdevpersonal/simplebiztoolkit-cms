export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="content-badge">{children}</span>;
}

export function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="content-callout">
      <div className="content-callout-title">{title}</div>
      <div className="content-callout-content">{children}</div>
    </aside>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="content-section">{children}</section>;
}

export function ContentFooter() {
  return (
    <footer className="content-footer">
      <p>
        About SimpleBizToolkit: We focus on low-friction tools for small
        business owners, entrepreneurs, and online sellers. Our products are
        designed to reduce admin, save time, and restore clarity. This content
        is practical guidance and not professional legal or accounting advice.
      </p>
    </footer>
  );
}
