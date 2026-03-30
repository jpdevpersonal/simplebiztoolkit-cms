import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sb-section">
      <div className="container" style={{ maxWidth: 860 }}>
        <h1 style={{ fontWeight: 900 }}>Page not found</h1>
        <p className="sb-muted">
          That page doesn’t exist (or has moved). Try one of these:
        </p>
        <div className="d-flex gap-2 flex-wrap">
          <Link className="btn sb-btn-primary" href="/">
            Go home
          </Link>
          <Link className="btn sb-btn-ghost" href="/products">
            Browse templates
          </Link>
          <Link className="btn sb-btn-ghost" href="/pages">
            Browse pages
          </Link>
        </div>
      </div>
    </section>
  );
}
