import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/aboutStyle.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind Simple Biz Toolkit and why these templates are built to be simple, essential, and reusable.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Simple Biz Toolkit",
    description:
      "The story behind Simple Biz Toolkit and why these templates are built to be simple, essential, and reusable.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className="sb-section">
      <div className="container">
        <div className="products-header">
          <h1 style={{ fontWeight: 900 }}>About</h1>
          <p className="sb-muted">
            Welcome to Simple Biz Toolkit: your source for simple convenient
            printable templates and business enhancing solutions.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="sb-card p-3">
            <p>
              At Simple Biz Toolkit, we specialize in crafting high-quality,
              printable forms and templates designed to streamline and simplify
              your business operations.
            </p>

            <section className="p-3 h-100">
              <h2>Why Choose Us?</h2>
              <ul>
                <li>
                  <strong>Time-Saving Solutions:</strong> Templates that let you
                  focus on what matters.
                </li>
                <li>
                  <strong>Affordability:</strong> Professional templates without
                  complex systems.
                </li>
                <li>
                  <strong>Original Designs:</strong> Unique, tailored solutions.
                </li>
                <li>
                  <strong>Versatility:</strong> From bookkeeping to planning.
                </li>
                <li>
                  <strong>Quality Assurance:</strong> Clear layouts and
                  printable formats.
                </li>
              </ul>
            </section>

            <section className="p-3 h-100">
              <h3>Our Commitment to You</h3>
              <p>
                We believe in delivering high quality products and exceptional
                service. Your feedback is invaluable.
              </p>
            </section>

            <section className="p-3 h-100">
              <h3>Ready to simplify your workflow?</h3>
              <p>
                Browse the store and discover how our templates can transform
                your admin into a simple routine.
              </p>

              <p className="mb-0">
                Julian
                <br />
                Founder
              </p>
            </section>
            <section>
              <p className="about-disclosure">
                Disclosure: This site may contain affiliate links. If you use
                them, SimpleBizToolkit may earn a commission at no extra cost to
                you.
              </p>
            </section>
          </div>

          <div className="mt-4 d-flex gap-2 flex-wrap">
            <Link
              href="/products"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.rem",
                padding: "0.5rem",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "12px",
                backgroundColor: "white",
                color: "var(--sb-green)",
                border: "2px solid var(--sb-green)",
              }}
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
