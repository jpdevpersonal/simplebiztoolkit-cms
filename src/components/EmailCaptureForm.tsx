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
    <form onSubmit={onSubmit} className="sb-email-form">
      <div className="sb-email-form-fields">
        <label className="visually-hidden" htmlFor={`email-${source}`}>
          Email address
        </label>
        <input
          id={`email-${source}`}
          className="form-control"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn sb-btn-primary" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : <>Get it now</>}
        </button>
      </div>

      {status === "success" && (
        <div
          className="sb-form-feedback is-success"
          role="status"
          aria-live="polite"
        >
          Success — check your inbox (placeholder flow for now).
        </div>
      )}
      {status === "error" && (
        <div className="sb-form-feedback is-error" role="alert">
          Something went wrong. Try again.
        </div>
      )}
    </form>
  );
}
