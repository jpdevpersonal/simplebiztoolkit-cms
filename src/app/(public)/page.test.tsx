import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getStatsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiService: {
    getStats: getStatsMock,
  },
}));

vi.mock("@/components/TestimonialGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="testimonial-grid" />,
}));

vi.mock("@/components/EmailCaptureForm", () => ({
  __esModule: true,
  default: () => <div data-testid="email-capture-form" />,
}));

const ALL_STATS = [
  { id: 1, name: "rating", value: "4.9", hidden: false },
  { id: 2, name: "reviews", value: "1250", hidden: false },
  { id: 3, name: "sales", value: "2500+", hidden: false },
  { id: 4, name: "star-seller", value: "Yes", hidden: false },
];

async function renderHome() {
  const { default: HomePage } = await import("./page");
  render(await HomePage());
}

describe("Home page trust statistics", () => {
  beforeEach(() => {
    vi.resetModules();
    getStatsMock.mockReset();
  });

  it("renders the visible stats returned by the public API", async () => {
    getStatsMock.mockResolvedValueOnce({ data: ALL_STATS, statusCode: 200 });

    await renderHome();

    const trustBar = screen.getByLabelText("Customer trust highlights");
    expect(trustBar).toHaveTextContent("4.9 average Etsy rating");
    expect(trustBar).toHaveTextContent("1250 customer reviews");
    expect(trustBar).toHaveTextContent("2500+ sales");
    expect(trustBar).toHaveTextContent("Etsy Star Seller");
    expect(trustBar).toHaveTextContent("Secure checkout via Etsy");
  });

  it("uses the API values in the About paragraph", async () => {
    getStatsMock.mockResolvedValueOnce({ data: ALL_STATS, statusCode: 200 });

    await renderHome();

    expect(
      screen.getByText(
        /With 2500\+ sales, a 4\.9 average rating and Etsy Star Seller status/,
      ),
    ).toBeInTheDocument();
  });

  it("omits stats that are absent from the public response", async () => {
    getStatsMock.mockResolvedValueOnce({
      data: [{ id: 2, name: "reviews", value: "1250", hidden: false }],
      statusCode: 200,
    });

    await renderHome();

    const trustBar = screen.getByLabelText("Customer trust highlights");
    expect(trustBar).toHaveTextContent("1250 customer reviews");
    expect(trustBar).not.toHaveTextContent("average Etsy rating");
    expect(trustBar).not.toHaveTextContent("sales");
    expect(trustBar).not.toHaveTextContent("Etsy Star Seller");
  });

  it("degrades gracefully when the stats request fails", async () => {
    getStatsMock.mockResolvedValueOnce({ error: "Boom", statusCode: 500 });

    await renderHome();

    const trustBar = screen.getByLabelText("Customer trust highlights");
    expect(trustBar).toHaveTextContent("Secure checkout via Etsy");
    expect(
      screen.getByText(
        /save time\. We focus on creating simple solutions that make everyday business tasks easier\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Simple business templates & tools that keep work moving",
      }),
    ).toBeInTheDocument();
  });
});

describe("Home page metadata", () => {
  beforeEach(() => {
    vi.resetModules();
    getStatsMock.mockReset();
  });

  it("appends the visible trust summary to the description", async () => {
    getStatsMock.mockResolvedValueOnce({ data: ALL_STATS, statusCode: 200 });

    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata();

    expect(metadata.description).toContain(
      "4.9 average rating, 1250 reviews, 2500+ sales, Etsy Star Seller.",
    );
  });

  it("omits the trust summary when no stats are visible", async () => {
    getStatsMock.mockResolvedValueOnce({ data: [], statusCode: 200 });

    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata();

    expect(metadata.description).toMatch(/instant PDF downloads via Etsy\.$/);
  });
});
