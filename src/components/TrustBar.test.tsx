import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TrustBar from "./TrustBar";

describe("TrustBar", () => {
  it("renders all trust items", () => {
    render(<TrustBar items={["Instant download", "Printable", "Reusable"]} />);

    expect(screen.getByText("Instant download")).toBeInTheDocument();
    expect(screen.getByText("Printable")).toBeInTheDocument();
    expect(screen.getByText("Reusable")).toBeInTheDocument();
  });
});
