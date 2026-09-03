import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatsEditor from "./StatsEditor";
import { clientApi } from "@/lib/clientApi";
import type { SiteStat } from "@/lib/stats";

const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    updateStat: vi.fn(),
    updateStats: vi.fn(),
  },
}));

const stats: SiteStat[] = [
  { id: 1, name: "rating", value: "4.8", hidden: false },
  { id: 2, name: "reviews", value: "240", hidden: false },
  { id: 3, name: "sales", value: "3850", hidden: false },
  { id: 4, name: "star-seller", value: "Yes", hidden: true },
];

function ratingInput() {
  return screen.getByLabelText("Average Etsy rating");
}

describe("StatsEditor", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the current values and visibility for every stat", () => {
    render(<StatsEditor stats={stats} />);

    expect(ratingInput()).toHaveValue("4.8");
    expect(screen.getByLabelText("Customer reviews")).toHaveValue("240");
    expect(screen.getByLabelText("Sales")).toHaveValue("3850");

    expect(
      document.getElementById("stat-star-seller-visible"),
    ).not.toBeChecked();
    expect(document.getElementById("stat-rating-visible")).toBeChecked();
  });

  it("renders Etsy Star Seller as Yes/No option buttons", () => {
    render(<StatsEditor stats={stats} />);

    const group = screen.getByRole("radiogroup", { name: "Etsy Star Seller" });

    const yes = within(group).getByRole("radio", { name: "Yes" });
    const no = within(group).getByRole("radio", { name: "No" });
    expect(yes).toBeChecked();
    expect(no).not.toBeChecked();
  });

  it("normalises stored star-seller values to Yes or No", () => {
    render(
      <StatsEditor
        stats={[{ id: 4, name: "star-seller", value: "true", hidden: false }]}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Etsy Star Seller" });
    expect(within(group).getByRole("radio", { name: "Yes" })).toBeChecked();
  });

  it("saves No when the star seller option is switched off", async () => {
    vi.mocked(clientApi.updateStat).mockResolvedValueOnce({
      id: 4,
      name: "star-seller",
      value: "No",
      hidden: true,
    } as never);

    render(<StatsEditor stats={stats} />);

    const group = screen.getByRole("radiogroup", { name: "Etsy Star Seller" });
    fireEvent.click(within(group).getByRole("radio", { name: "No" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Save Etsy Star Seller" }),
    );

    await waitFor(() => {
      expect(clientApi.updateStat).toHaveBeenCalledWith("star-seller", {
        value: "No",
        hidden: true,
      });
    });
  });

  it("defaults missing stats to empty and visible", () => {
    render(<StatsEditor stats={[]} />);

    expect(ratingInput()).toHaveValue("");
    expect(document.getElementById("stat-rating-visible")).toBeChecked();

    const group = screen.getByRole("radiogroup", { name: "Etsy Star Seller" });
    expect(within(group).getByRole("radio", { name: "No" })).toBeChecked();
  });

  it("saves all four stats through the bulk endpoint", async () => {
    vi.mocked(clientApi.updateStats).mockResolvedValueOnce(stats as never);

    render(<StatsEditor stats={stats} />);

    fireEvent.change(ratingInput(), { target: { value: "4.9" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Save All Statistics" }),
    );

    await waitFor(() => {
      expect(clientApi.updateStats).toHaveBeenCalledWith([
        { name: "rating", value: "4.9", hidden: false },
        { name: "reviews", value: "240", hidden: false },
        { name: "sales", value: "3850", hidden: false },
        { name: "star-seller", value: "Yes", hidden: true },
      ]);
      expect(screen.getByText("All statistics saved.")).toBeInTheDocument();
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("saves a single stat through the per-stat endpoint", async () => {
    vi.mocked(clientApi.updateStat).mockResolvedValueOnce({
      id: 3,
      name: "sales",
      value: "4000+",
      hidden: false,
    } as never);

    render(<StatsEditor stats={stats} />);

    fireEvent.change(screen.getByLabelText("Sales"), {
      target: { value: " 4000+ " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Sales" }));

    await waitFor(() => {
      expect(clientApi.updateStat).toHaveBeenCalledWith("sales", {
        value: "4000+",
        hidden: false,
      });
      expect(screen.getByText("Sales saved.")).toBeInTheDocument();
    });
    expect(clientApi.updateStats).not.toHaveBeenCalled();
  });

  it("sends the hidden flag when visibility is toggled off", async () => {
    vi.mocked(clientApi.updateStat).mockResolvedValueOnce(stats[1] as never);

    render(<StatsEditor stats={stats} />);

    fireEvent.click(document.getElementById("stat-reviews-visible")!);
    fireEvent.click(
      screen.getByRole("button", { name: "Save Customer reviews" }),
    );

    await waitFor(() => {
      expect(clientApi.updateStat).toHaveBeenCalledWith("reviews", {
        value: "240",
        hidden: true,
      });
    });
  });

  it("blocks saving and explains when a value exceeds 10 characters", async () => {
    render(<StatsEditor stats={stats} />);

    fireEvent.change(ratingInput(), { target: { value: "12345678901" } });

    expect(
      screen.getByText("Value must be 10 characters or fewer (currently 11)."),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Save All Statistics" }),
    );

    expect(clientApi.updateStats).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /Average Etsy rating: Value must be 10 characters or fewer/,
      ),
    ).toBeInTheDocument();
  });

  it("blocks saving when a value is empty", () => {
    render(<StatsEditor stats={stats} />);

    fireEvent.change(ratingInput(), { target: { value: "  " } });
    fireEvent.click(
      screen.getByRole("button", { name: "Save Average Etsy rating" }),
    );

    expect(clientApi.updateStat).not.toHaveBeenCalled();
    expect(
      screen.getByText("Average Etsy rating: Enter a value."),
    ).toBeInTheDocument();
  });

  it("shows a saving state while the bulk request is in flight", async () => {
    let resolveSave: (value: unknown) => void = () => {};
    vi.mocked(clientApi.updateStats).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSave = resolve;
      }) as never,
    );

    render(<StatsEditor stats={stats} />);

    const saveAll = screen.getByRole("button", { name: "Save All Statistics" });
    fireEvent.click(saveAll);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });

    resolveSave(stats);
    await waitFor(() => {
      expect(screen.getByText("All statistics saved.")).toBeInTheDocument();
    });
  });

  it.each([
    [400, "Duplicate stat name in request", "Duplicate stat name in request"],
    [401, "Unauthorized", "Your session has expired. Please sign in again."],
    [403, "Forbidden", "You are not authorized to change site statistics."],
    [404, "Not found", "That statistic no longer exists on the server."],
    [
      429,
      "Too many",
      "Too many admin requests. Wait a moment, then save again.",
    ],
    [
      500,
      "Server exploded",
      "The server could not save the statistics. Please try again.",
    ],
  ])(
    "maps HTTP %i failures to a helpful message",
    async (status, apiMessage, expected) => {
      const failure = Object.assign(new Error(apiMessage as string), {
        status,
      });
      vi.mocked(clientApi.updateStats).mockRejectedValueOnce(failure);

      render(<StatsEditor stats={stats} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Save All Statistics" }),
      );

      await waitFor(() => {
        expect(screen.getByText(expected as string)).toBeInTheDocument();
      });
    },
  );

  it("falls back to the raw error message for unexpected failures", async () => {
    vi.mocked(clientApi.updateStats).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<StatsEditor stats={stats} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Save All Statistics" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("surfaces a load error passed from the server component", () => {
    render(<StatsEditor stats={[]} loadError="HTTP 500: Server Error" />);

    expect(screen.getByText("HTTP 500: Server Error")).toBeInTheDocument();
  });
});
