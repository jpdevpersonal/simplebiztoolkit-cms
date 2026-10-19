import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TrackedLink from "./TrackedLink";

const trackPublicEvent = vi.fn();

vi.mock("@/lib/analytics", () => ({
  trackPublicEvent: (...args: unknown[]) => trackPublicEvent(...args),
}));

describe("TrackedLink", () => {
  it("tracks the click and preserves the supplied click handler", () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );

    render(
      <TrackedLink
        href="/templates"
        eventName="cta_click"
        eventParams={{
          placement: "homepage_hero",
          destination_type: "template_category",
        }}
        onClick={onClick}
      >
        Browse templates
      </TrackedLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Browse templates" }));

    expect(trackPublicEvent).toHaveBeenCalledWith("cta_click", {
      placement: "homepage_hero",
      destination_type: "template_category",
    });
    expect(onClick).toHaveBeenCalledOnce();
  });
});
