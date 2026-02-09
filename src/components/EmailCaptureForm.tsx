"use client";

import { useState } from "react";

type Props = {
  source: string; // e.g. "home-hero", "freebie-page", "blog-cta"
};

async function submitEmail(email: string, source: string) {
  // Placeholder: replace with your email provider integration.
  // Example: POST to Netlify Function /api/subscribe => Mailchimp/MailerLite.
  await new Promise((r) => setTimeout(r, 600));
  console.log("Captured email:", { email, source });
}

export default function EmailCaptureForm({ source }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await submitEmail(email.trim(), source);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column flex-sm-row gap-2">
      <input
        className="form-control"
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
      />
      <button className="btn sb-btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : <>Get it now</>}
      </button>

      {status === "success" && (
        <div className="sb-muted mt-2" style={{ fontSize: 13 }}>
          Success — check your inbox (placeholder flow for now).
        </div>
      )}
      {status === "error" && (
        <div className="text-danger mt-2" style={{ fontSize: 13 }}>
          Something went wrong. Try again.
        </div>
      )}
    </form>
  );
}
