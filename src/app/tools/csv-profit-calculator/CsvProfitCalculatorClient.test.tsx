import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import CsvProfitCalculatorClient from "./CsvProfitCalculatorClient";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

function getCsvInput(container: HTMLElement) {
  const input = container.querySelector("#csvInput") as HTMLInputElement | null;
  if (!input) {
    throw new Error("CSV input not found");
  }
  return input;
}

async function uploadFile(
  container: HTMLElement,
  options: { name: string; content: string; type?: string },
) {
  const file = new File([options.content], options.name, {
    type: options.type ?? "text/csv",
  });

  fireEvent.change(getCsvInput(container), {
    target: { files: [file] },
  });
}

describe("CsvProfitCalculatorClient", () => {
  it("links the Tools breadcrumb back to the pages-level Tools listing", () => {
    render(<CsvProfitCalculatorClient />);

    expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/pages/tools",
    );
  });

  it("shows a validation error when a non-CSV file is uploaded", async () => {
    const { container } = render(<CsvProfitCalculatorClient />);

    await uploadFile(container, {
      name: "not-a-csv.txt",
      type: "text/plain",
      content: "hello",
    });

    expect(
      await screen.findAllByText(/Please choose an Etsy CSV file/i),
    ).toHaveLength(2);
  });

  it("uploads a CSV and generates the monthly summary", async () => {
    const { container } = render(<CsvProfitCalculatorClient />);

    await uploadFile(container, {
      name: "january-february.csv",
      content: [
        "Date,Type,Amount,Fee,Net,Description",
        "2026-01-05,Sale,$100.00,-$10.00,$90.00,Order 1",
        "2026-01-10,Refund,($20.00),$0.00,-$20.00,Refunded order",
        "2026-02-02,Fee,-$5.00,$0.00,-$5.00,Listing fee",
      ].join("\n"),
    });

    await screen.findByText(/january-february\.csv/i);

    const processButton = screen.getByRole("button", {
      name: /Generate Profit Breakdown/i,
    });
    await waitFor(() => expect(processButton).toBeEnabled());

    fireEvent.click(processButton);

    expect(await screen.findAllByText("2026-01")).toHaveLength(2);
    expect(screen.getAllByText("2026-02")).toHaveLength(2);
    expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-$10.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$70.00").length).toBeGreaterThan(0);
  });

  it("shows a money-format error when rows contain invalid currency values", async () => {
    const { container } = render(<CsvProfitCalculatorClient />);

    await uploadFile(container, {
      name: "invalid-amount.csv",
      content: [
        "Date,Type,Amount,Fee,Net,Description",
        "2026-01-05,Sale,abc,-$10.00,$90.00,Order 1",
      ].join("\n"),
    });

    await screen.findByText(/invalid-amount\.csv/i);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Generate Profit Breakdown/i,
      }),
    );

    expect(
      await screen.findAllByText(
        /some money values are not in the expected format/i,
      ),
    ).toHaveLength(2);
  });

  it("recomputes estimated profit when extra monthly costs are entered", async () => {
    const { container } = render(<CsvProfitCalculatorClient />);

    await uploadFile(container, {
      name: "with-costs.csv",
      content: [
        "Date,Type,Amount,Fee,Net,Description",
        "2026-01-05,Sale,$100.00,-$10.00,$90.00,Order 1",
        "2026-01-10,Refund,($20.00),$0.00,-$20.00,Refunded order",
      ].join("\n"),
    });

    await screen.findByText(/with-costs\.csv/i);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Generate Profit Breakdown/i,
      }),
    );

    const packagingInput = (await screen.findByLabelText(
      "2026-01 Packaging",
    )) as HTMLInputElement;

    fireEvent.input(packagingInput, { target: { value: "12.5" } });

    expect(screen.getByDisplayValue("12.5")).toBeInTheDocument();
    expect(screen.getAllByText("$57.50").length).toBeGreaterThan(0);
  });
});
