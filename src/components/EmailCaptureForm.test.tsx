import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EmailCaptureForm from "./EmailCaptureForm";

describe("EmailCaptureForm", () => {
  it("submits and shows success state", async () => {
    render(<EmailCaptureForm source="home-hero" />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get it now/i }));

    expect(screen.getByText("Sending...")).toBeInTheDocument();

    expect(
      await screen.findByText(/Success — check your inbox/i),
    ).toBeInTheDocument();
  });
});
