import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthProvider from "./AuthProvider";

const sessionProviderSpy = vi.fn();

vi.mock("next-auth/react", () => ({
  SessionProvider: ({
    children,
    refetchInterval,
  }: {
    children: React.ReactNode;
    refetchInterval?: number;
  }) => {
    sessionProviderSpy(refetchInterval);
    return <div data-testid="session-provider">{children}</div>;
  },
}));

describe("AuthProvider", () => {
  it("wraps children in SessionProvider with refetchInterval=0", () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>,
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(sessionProviderSpy).toHaveBeenCalledWith(0);
  });
});
