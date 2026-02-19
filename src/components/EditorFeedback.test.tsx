import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EditorFeedback from "./EditorFeedback";

describe("EditorFeedback", () => {
  it("renders nothing when both props are absent", () => {
    const { container } = render(<EditorFeedback />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when both props are null", () => {
    const { container } = render(
      <EditorFeedback message={null} error={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a success message", () => {
    render(<EditorFeedback message="Saved successfully!" />);
    expect(screen.getByText("Saved successfully!")).toBeTruthy();
  });

  it("does not render an error when only message is set", () => {
    render(<EditorFeedback message="OK" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders an error alert with role=alert", () => {
    render(<EditorFeedback error="Something went wrong" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Something went wrong");
  });

  it("does not render a success banner when only error is set", () => {
    const { container } = render(<EditorFeedback error="Oops" />);
    // role=alert present but no extra sibling
    const children = Array.from(container.children);
    expect(children.length).toBe(1);
  });

  it("renders both message and error when both are provided", () => {
    render(<EditorFeedback message="Saved!" error="Also an error" />);
    expect(screen.getByText("Saved!")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
