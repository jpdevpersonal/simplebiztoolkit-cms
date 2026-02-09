export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="article-badge">{children}</span>;
}

export function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="article-callout">
      <div className="article-callout-title">{title}</div>
      <div className="article-callout-content">{children}</div>
    </aside>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="article-section">{children}</section>;
}

export function ArticleFooter() {
  return (
    <footer className="article-footer">
      <p>
        About SimpleBizToolkit: We focus on low-friction tools for small
        business owners, entrepreneurs, and online sellers. Our products are
        designed to reduce admin, save time, and restore clarity. This article
        is practical guidance and not professional legal or accounting advice.
      </p>
    </footer>
  );
}
