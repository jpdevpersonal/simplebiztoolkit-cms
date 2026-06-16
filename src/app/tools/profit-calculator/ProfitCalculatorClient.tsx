"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const TOOLS_PAGES_HREF = "/pages/tools";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT;
const ADSENSE_PROFIT_CALCULATOR_SLOT =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PROFIT_CALCULATOR_SLOT;
const HAS_ADSENSE_CONFIG = Boolean(
  ADSENSE_CLIENT && ADSENSE_PROFIT_CALCULATOR_SLOT,
);

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type CalculatorMode = "profit" | "target-profit" | "target-margin";

interface FeeSettings {
  transactionPct: number;
  paymentPct: number;
  paymentFixed: number;
  listingFee: number;
  offsitePct: number;
}

interface FormValues extends FeeSettings {
  mode: CalculatorMode;
  currency: string;
  sellingPrice: number;
  materials: number;
  packaging: number;
  labour: number;
  postage: number;
  other: number;
  desiredProfit: number;
  desiredMargin: number;
  monthlyFixed: number;
  targetMonthly: number;
}

interface CalcResult {
  sellingPrice: number;
  totalProductCost: number;
  transactionFee: number;
  paymentProcessingFee: number;
  listingFee: number;
  offsiteFee: number;
  totalFees: number;
  profit: number;
  margin: number;
  markup: number;
  breakEvenSales: number | null;
  targetSales: number | null;
}

interface ScenarioRow {
  label: string;
  sellingPrice: number;
  totalFees: number;
  profit: number;
  margin: number;
  isRecommended: boolean;
}

interface ValidationError {
  message: string;
}

type CalcOutcome =
  | { ok: true; result: CalcResult }
  | { ok: false; error: ValidationError };

function totalProductCost(v: FormValues): number {
  return v.materials + v.packaging + v.labour + v.postage + v.other;
}

/** Combined percentage fee rate as a decimal (e.g. 0.105 for 10.5%). */
function percentageFeeRate(v: FeeSettings): number {
  return (v.transactionPct + v.paymentPct + v.offsitePct) / 100;
}

function fixedFees(v: FeeSettings): number {
  return v.paymentFixed + v.listingFee;
}

/** Validate inputs shared by all modes. Returns an error message or null. */
function validateCommon(v: FormValues): string | null {
  const costs: Array<[string, number]> = [
    ["Materials cost", v.materials],
    ["Packaging cost", v.packaging],
    ["Labour cost", v.labour],
    ["Postage / shipping cost", v.postage],
    ["Other cost", v.other],
    ["Selling price", v.sellingPrice],
    ["Monthly fixed costs", v.monthlyFixed],
    ["Target monthly profit", v.targetMonthly],
  ];
  for (const [label, value] of costs) {
    if (value < 0) {
      return `${label} cannot be negative.`;
    }
  }

  const fees: Array<[string, number]> = [
    ["Transaction fee", v.transactionPct],
    ["Payment processing", v.paymentPct],
    ["Offsite ads", v.offsitePct],
    ["Payment fixed fee", v.paymentFixed],
    ["Listing fee", v.listingFee],
  ];
  for (const [label, value] of fees) {
    if (value < 0) {
      return `${label} cannot be negative.`;
    }
  }

  const rate = percentageFeeRate(v);
  if (rate >= 1) {
    return "Your percentage fees add up to 100% or more, which leaves nothing to keep. Check the fee settings.";
  }
  return null;
}

/** Sales-target metrics that depend on per-sale profit. */
function salesTargets(
  v: FormValues,
  profit: number,
): { breakEvenSales: number | null; targetSales: number | null } {
  let breakEvenSales: number | null = null;
  let targetSales: number | null = null;

  if (v.monthlyFixed > 0 && profit > 0) {
    breakEvenSales = Math.ceil(v.monthlyFixed / profit);
  }
  if (v.targetMonthly > 0 && profit > 0) {
    const needed = v.targetMonthly + v.monthlyFixed;
    targetSales = Math.ceil(needed / profit);
  }
  return { breakEvenSales, targetSales };
}

/** Compute the full result for a known selling price. */
function computeForPrice(v: FormValues, price: number): CalcResult {
  const cost = totalProductCost(v);
  const transactionFee = price * (v.transactionPct / 100);
  const paymentProcessingFee = price * (v.paymentPct / 100) + v.paymentFixed;
  const offsiteFee = price * (v.offsitePct / 100);
  const listingFee = v.listingFee;
  const totalFees =
    transactionFee + paymentProcessingFee + offsiteFee + listingFee;
  const profit = price - cost - totalFees;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;
  const { breakEvenSales, targetSales } = salesTargets(v, profit);

  return {
    sellingPrice: price,
    totalProductCost: cost,
    transactionFee,
    paymentProcessingFee,
    listingFee,
    offsiteFee,
    totalFees,
    profit,
    margin,
    markup,
    breakEvenSales,
    targetSales,
  };
}

function calculate(v: FormValues): CalcOutcome {
  const commonError = validateCommon(v);
  if (commonError) {
    return { ok: false, error: { message: commonError } };
  }

  const cost = totalProductCost(v);
  const rate = percentageFeeRate(v);
  const fixed = fixedFees(v);

  if (v.mode === "profit") {
    if (v.sellingPrice <= 0) {
      return {
        ok: false,
        error: { message: "Enter a selling price greater than 0." },
      };
    }
    return { ok: true, result: computeForPrice(v, v.sellingPrice) };
  }

  if (v.mode === "target-profit") {
    if (v.desiredProfit <= 0) {
      return {
        ok: false,
        error: { message: "Enter a desired profit per sale greater than 0." },
      };
    }
    const price = (cost + v.desiredProfit + fixed) / (1 - rate);
    return { ok: true, result: computeForPrice(v, price) };
  }

  // target-margin
  const marginRate = v.desiredMargin / 100;
  if (marginRate <= 0) {
    return {
      ok: false,
      error: { message: "Enter a desired profit margin greater than 0%." },
    };
  }
  const denominator = 1 - rate - marginRate;
  if (denominator <= 0) {
    return {
      ok: false,
      error: {
        message:
          "That target margin is impossible with your current fees. Lower the target margin or your fees so that fees % + margin % stays below 100%.",
      },
    };
  }
  const price = (cost + fixed) / denominator;
  return { ok: true, result: computeForPrice(v, price) };
}

function buildScenarios(v: FormValues, basePrice: number): ScenarioRow[] {
  const multipliers: Array<{
    label: string;
    factor: number;
    recommended: boolean;
  }> = [
    { label: "Price − 20%", factor: 0.8, recommended: false },
    { label: "Price − 10%", factor: 0.9, recommended: false },
    { label: "Calculated price", factor: 1.0, recommended: true },
    { label: "Price + 10%", factor: 1.1, recommended: false },
    { label: "Price + 20%", factor: 1.2, recommended: false },
  ];

  return multipliers.map((m) => {
    const price = basePrice * m.factor;
    const r = computeForPrice(v, price);
    return {
      label: m.label,
      sellingPrice: price,
      totalFees: r.totalFees,
      profit: r.profit,
      margin: r.margin,
      isRecommended: m.recommended,
    };
  });
}

/**
 * Region-specific Etsy fee defaults, keyed by currency symbol.
 * The transaction fee (6.5%) is the same worldwide, so only the
 * payment-processing rate, the fixed payment fee and the listing fee
 * (a flat $0.20 USD, shown in local currency) change per region.
 */
interface CurrencyFeeDefaults {
  paymentPct: string;
  paymentFixed: string;
  listingFee: string;
}

const CURRENCY_FEE_DEFAULTS: Record<string, CurrencyFeeDefaults> = {
  // United Kingdom (GBP)
  "£": { paymentPct: "4", paymentFixed: "0.20", listingFee: "0.16" },
  // United States (USD)
  $: { paymentPct: "3", paymentFixed: "0.25", listingFee: "0.20" },
  // Eurozone (EUR)
  "€": { paymentPct: "4", paymentFixed: "0.30", listingFee: "0.18" },
};

const DEFAULT_CURRENCY = "£";

function money(currency: string, amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency}${Math.abs(amount).toFixed(2)}`;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function setupProfitCalculator(root: HTMLElement) {
  const documentRef = root.ownerDocument;
  const windowRef = documentRef.defaultView;
  if (!windowRef) return () => undefined;

  const cleanupFns: Array<() => void> = [];

  const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const el = root.querySelector<T>("#" + id);
    if (!el) {
      throw new Error("Missing element #" + id);
    }
    return el;
  };

  const on = (
    target: EventTarget | null | undefined,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) => {
    if (!target) return;
    target.addEventListener(type, handler, options);
    cleanupFns.push(() => target.removeEventListener(type, handler, options));
  };

  /** Read a numeric input value, treating blanks as 0. */
  const num = (id: string): number => {
    const value = parseFloat($<HTMLInputElement>(id).value);
    return Number.isFinite(value) ? value : 0;
  };

  const getString = (id: string): string =>
    $<HTMLInputElement | HTMLSelectElement>(id).value;

  const getMode = (): CalculatorMode => {
    const checked = root.querySelector<HTMLInputElement>(
      'input[name="mode"]:checked',
    );
    return (checked?.value as CalculatorMode) ?? "profit";
  };

  const readForm = (): FormValues => ({
    mode: getMode(),
    currency: getString("currency") || "£",
    sellingPrice: num("sellingPrice"),
    materials: num("materials"),
    packaging: num("packaging"),
    labour: num("labour"),
    postage: num("postage"),
    other: num("other"),
    transactionPct: num("transactionPct"),
    paymentPct: num("paymentPct"),
    paymentFixed: num("paymentFixed"),
    listingFee: num("listingFee"),
    offsitePct: num("offsitePct"),
    desiredProfit: num("desiredProfit"),
    desiredMargin: num("desiredMargin"),
    monthlyFixed: num("monthlyFixed"),
    targetMonthly: num("targetMonthly"),
  });

  const setText = (id: string, text: string, negative = false): void => {
    const el = $(id);
    el.textContent = text;
    el.classList.toggle("value-negative", negative);
  };

  const toggleResults = (show: boolean): void => {
    $("results-placeholder").hidden = show;
    $("results-content").hidden = !show;
    $("scenario-section").hidden = !show;
  };

  const showError = (message: string): void => {
    const box = $("form-error");
    box.textContent = message;
    box.hidden = false;
    toggleResults(false);
  };

  const clearError = (): void => {
    const box = $("form-error");
    box.textContent = "";
    box.hidden = true;
  };

  const renderScenarios = (v: FormValues, basePrice: number): void => {
    const body = $<HTMLTableSectionElement>("scenario-body");
    body.textContent = "";
    const rows = buildScenarios(v, basePrice);
    const c = v.currency;

    for (const row of rows) {
      const tr = documentRef.createElement("tr");
      if (row.isRecommended) {
        tr.classList.add("is-recommended");
      }

      const cells: Array<{ label: string; text: string; negative?: boolean }> =
        [
          { label: "Scenario", text: row.label },
          { label: "Selling price", text: money(c, row.sellingPrice) },
          { label: "Total fees", text: money(c, row.totalFees) },
          {
            label: "Profit",
            text: money(c, row.profit),
            negative: row.profit < 0,
          },
          {
            label: "Margin",
            text: percent(row.margin),
            negative: row.margin < 0,
          },
        ];

      cells.forEach((cell, index) => {
        const el =
          index === 0
            ? documentRef.createElement("th")
            : documentRef.createElement("td");
        if (index === 0) {
          el.setAttribute("scope", "row");
        }
        el.setAttribute("data-label", cell.label);
        el.textContent = cell.text;
        if (cell.negative) {
          el.classList.add("value-negative");
        }
        tr.appendChild(el);
      });

      body.appendChild(tr);
    }
  };

  const renderResult = (v: FormValues, result: CalcResult): void => {
    const c = v.currency;
    const isPriceMode = v.mode === "profit";

    const headlineLabel = $("headline-label");
    headlineLabel.textContent = isPriceMode
      ? "Profit per sale"
      : "Recommended selling price";

    const headlineValue = $("headline-value");
    const value = isPriceMode ? result.profit : result.sellingPrice;
    headlineValue.textContent = money(c, value);
    headlineValue.classList.toggle("value-negative", isPriceMode && value < 0);

    setText("r-cost", money(c, result.totalProductCost));
    setText("r-transaction", money(c, result.transactionFee));
    setText("r-payment", money(c, result.paymentProcessingFee));
    setText("r-listing", money(c, result.listingFee));
    setText("r-offsite", money(c, result.offsiteFee));
    setText("r-fees", money(c, result.totalFees));
    setText("r-profit", money(c, result.profit), result.profit < 0);
    setText("r-margin", percent(result.margin), result.margin < 0);
    setText("r-markup", percent(result.markup), result.markup < 0);
    setText(
      "r-breakeven",
      result.breakEvenSales === null
        ? "—"
        : `${result.breakEvenSales} sale${result.breakEvenSales === 1 ? "" : "s"}`,
    );
    setText(
      "r-target-sales",
      result.targetSales === null
        ? "—"
        : `${result.targetSales} sale${result.targetSales === 1 ? "" : "s"}`,
    );

    renderScenarios(v, result.sellingPrice);
    toggleResults(true);
  };

  const updateFieldVisibility = (): void => {
    const mode = getMode();
    $("price-field").style.display = mode === "profit" ? "" : "none";
    $("desiredProfit-field").style.display =
      mode === "target-profit" ? "" : "none";
    $("desiredMargin-field").style.display =
      mode === "target-margin" ? "" : "none";
  };

  /**
   * Switch the region-specific Etsy fee fields (payment processing %,
   * fixed payment fee and listing fee) to match the selected currency.
   */
  const applyCurrencyFees = (currency: string): void => {
    const fees = CURRENCY_FEE_DEFAULTS[currency];
    if (!fees) return;
    $<HTMLInputElement>("paymentPct").value = fees.paymentPct;
    $<HTMLInputElement>("paymentFixed").value = fees.paymentFixed;
    $<HTMLInputElement>("listingFee").value = fees.listingFee;
  };

  root
    .querySelectorAll<HTMLInputElement>('input[name="mode"]')
    .forEach((radio) => {
      on(radio, "change", updateFieldVisibility);
    });
  updateFieldVisibility();

  on($("currency"), "change", () => {
    applyCurrencyFees(getString("currency"));
  });

  const form = $<HTMLFormElement>("calc-form");

  on(form, "submit", (event) => {
    event.preventDefault();
    clearError();
    const values = readForm();
    const outcome = calculate(values);
    if (outcome.ok) {
      renderResult(values, outcome.result);
    } else {
      showError(outcome.error.message);
    }
  });

  on(form, "reset", () => {
    clearError();
    toggleResults(false);
    // Restore default fee values after the native reset clears them.
    windowRef.setTimeout(() => {
      $<HTMLInputElement>("transactionPct").value = "6.5";
      $<HTMLInputElement>("offsitePct").value = "0";
      // The currency select returns to its default, so re-apply the
      // region-specific payment and listing fees to match.
      applyCurrencyFees(getString("currency") || DEFAULT_CURRENCY);
      updateFieldVisibility();
    }, 0);
  });

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}

export default function ProfitCalculatorClient() {
  const rootRef = useRef<HTMLDivElement>(null);
  const adSlotRef = useRef<HTMLElement | null>(null);
  const [adScriptLoaded, setAdScriptLoaded] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    return setupProfitCalculator(rootRef.current);
  }, []);

  useEffect(() => {
    if (!HAS_ADSENSE_CONFIG || adScriptLoaded) return;

    const timer = window.setTimeout(() => {
      setIsAdBlocked(true);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [adScriptLoaded]);

  useEffect(() => {
    if (!HAS_ADSENSE_CONFIG || !adScriptLoaded || isAdBlocked) return;

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});

      const timer = window.setTimeout(() => {
        const slot = adSlotRef.current;
        if (!slot) return;

        const status = slot.getAttribute("data-ad-status");
        const hasIframe = Boolean(slot.querySelector("iframe"));
        if (status !== "filled" && !hasIframe) {
          setIsAdBlocked(true);
        }
      }, 2500);

      return () => {
        window.clearTimeout(timer);
      };
    } catch {
      // Ad blockers or script timing can prevent AdSense from hydrating.
      window.setTimeout(() => {
        setIsAdBlocked(true);
      }, 0);
    }
  }, [adScriptLoaded, isAdBlocked]);

  return (
    <div ref={rootRef} className="profit-calculator-page">
      <a className="skip-link" href="#calc-form">
        Skip to the tool
      </a>
      <main>
        <nav className="page-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Simple Biz Toolkit</Link>
            </li>
            <li>
              <Link href={TOOLS_PAGES_HREF}>Tools</Link>
            </li>
            <li aria-current="page">Profit Calculator for Etsy</li>
          </ol>
        </nav>

        <section className="tool-hero" aria-labelledby="hero-heading">
          <span className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Free tool · No sign-up · Runs in your browser
          </span>
          <h1 id="hero-heading">Profit Calculator for Etsy</h1>
          <p>
            Calculate Etsy fees, product costs, profit margin, and the price you
            need to charge to make a real profit. Everything runs in your
            browser — nothing is uploaded or stored.
          </p>
        </section>

        {HAS_ADSENSE_CONFIG && !isAdBlocked ? (
          <>
            <Script
              id="adsense-profit-calculator"
              async
              strategy="afterInteractive"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
                ADSENSE_CLIENT ?? "",
              )}`}
              crossOrigin="anonymous"
              onLoad={() => setAdScriptLoaded(true)}
              onError={() => setIsAdBlocked(true)}
            />
            <aside className="ad-card" aria-label="Advertisement">
              <span className="ad-label">Advertisement</span>
              <ins
                ref={(el) => {
                  adSlotRef.current = el;
                }}
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={ADSENSE_PROFIT_CALCULATOR_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </aside>
          </>
        ) : null}

        <div className="container layout">
          {/* Calculator form */}
          <section className="card form-card" aria-labelledby="form-heading">
            <h2 id="form-heading">Your figures</h2>

            <p className="privacy-note" role="note">
              Your data stays in your browser. Nothing is uploaded, stored, or
              sent to a server.
            </p>

            <form id="calc-form" noValidate>
              <fieldset className="field-group">
                <legend>Calculator mode</legend>
                <div className="radio-row">
                  <label className="radio">
                    <input
                      type="radio"
                      name="mode"
                      value="profit"
                      defaultChecked
                    />
                    <span>Calculate profit from selling price</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="mode" value="target-profit" />
                    <span>Find price for target profit</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="mode" value="target-margin" />
                    <span>Find price for target margin</span>
                  </label>
                </div>
              </fieldset>

              <div className="grid-2">
                <div className="field">
                  <label htmlFor="currency">Currency</label>
                  <select id="currency" name="currency" defaultValue="£">
                    <option value="£">£ (GBP)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                  </select>
                </div>
                <div className="field" id="price-field">
                  <label htmlFor="sellingPrice">Selling price</label>
                  <input
                    type="number"
                    id="sellingPrice"
                    name="sellingPrice"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <fieldset className="field-group">
                <legend>Product costs</legend>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="materials">Materials cost</label>
                    <input
                      type="number"
                      id="materials"
                      name="materials"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="packaging">Packaging cost</label>
                    <input
                      type="number"
                      id="packaging"
                      name="packaging"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="labour">Labour cost</label>
                    <input
                      type="number"
                      id="labour"
                      name="labour"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="postage">Postage / shipping cost</label>
                    <input
                      type="number"
                      id="postage"
                      name="postage"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="other">Other cost</label>
                    <input
                      type="number"
                      id="other"
                      name="other"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="field-group">
                <legend>Etsy fee settings</legend>
                <p className="hint">
                  These update to the standard Etsy rates for the currency you
                  pick. Fees vary by country and can change over time, so edit
                  them to match your account.
                </p>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="transactionPct">Transaction fee (%)</label>
                    <input
                      type="number"
                      id="transactionPct"
                      name="transactionPct"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue="6.5"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="paymentPct">Payment processing (%)</label>
                    <input
                      type="number"
                      id="paymentPct"
                      name="paymentPct"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue="4"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="paymentFixed">Payment fixed fee</label>
                    <input
                      type="number"
                      id="paymentFixed"
                      name="paymentFixed"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue="0.20"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="listingFee">Listing fee</label>
                    <input
                      type="number"
                      id="listingFee"
                      name="listingFee"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue="0.16"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="offsitePct">
                      Offsite ads (%) <span className="optional">optional</span>
                    </label>
                    <input
                      type="number"
                      id="offsitePct"
                      name="offsitePct"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue="0"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="field-group">
                <legend>Profit target</legend>
                <div className="grid-2">
                  <div className="field" id="desiredProfit-field">
                    <label htmlFor="desiredProfit">
                      Desired profit per sale
                    </label>
                    <input
                      type="number"
                      id="desiredProfit"
                      name="desiredProfit"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field" id="desiredMargin-field">
                    <label htmlFor="desiredMargin">
                      Desired profit margin (%)
                    </label>
                    <input
                      type="number"
                      id="desiredMargin"
                      name="desiredMargin"
                      min="0"
                      max="99.9"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="0"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="monthlyFixed">
                      Monthly fixed costs{" "}
                      <span className="optional">optional</span>
                    </label>
                    <input
                      type="number"
                      id="monthlyFixed"
                      name="monthlyFixed"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="targetMonthly">
                      Target monthly profit{" "}
                      <span className="optional">optional</span>
                    </label>
                    <input
                      type="number"
                      id="targetMonthly"
                      name="targetMonthly"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="actions">
                <button type="submit" className="btn btn-primary">
                  Calculate
                </button>
                <button
                  type="reset"
                  className="btn btn-secondary"
                  id="reset-btn"
                >
                  Reset
                </button>
              </div>

              <div
                id="form-error"
                className="form-error"
                role="alert"
                aria-live="assertive"
                hidden
              />
            </form>
          </section>

          {/* Results */}
          <section
            className="card results-card"
            aria-labelledby="results-heading"
          >
            <h2 id="results-heading">Results</h2>

            <div id="results" aria-live="polite">
              <p className="placeholder" id="results-placeholder">
                Enter your figures and select a mode, then press{" "}
                <strong>Calculate</strong> to see your Etsy fees, profit, and
                recommended price.
              </p>

              <div id="results-content" hidden>
                <div className="headline" id="headline-block">
                  <span className="headline-label" id="headline-label">
                    Recommended selling price
                  </span>
                  <span className="headline-value" id="headline-value">
                    —
                  </span>
                </div>

                <dl className="breakdown">
                  <div className="row">
                    <dt>Total product cost</dt>
                    <dd id="r-cost">—</dd>
                  </div>
                  <div className="row">
                    <dt>Etsy transaction fee</dt>
                    <dd id="r-transaction">—</dd>
                  </div>
                  <div className="row">
                    <dt>Payment processing fee</dt>
                    <dd id="r-payment">—</dd>
                  </div>
                  <div className="row">
                    <dt>Listing fee</dt>
                    <dd id="r-listing">—</dd>
                  </div>
                  <div className="row">
                    <dt>Offsite ads fee</dt>
                    <dd id="r-offsite">—</dd>
                  </div>
                  <div className="row total">
                    <dt>Total Etsy fees</dt>
                    <dd id="r-fees">—</dd>
                  </div>
                  <div className="row strong">
                    <dt>Profit per sale</dt>
                    <dd id="r-profit">—</dd>
                  </div>
                  <div className="row">
                    <dt>Profit margin</dt>
                    <dd id="r-margin">—</dd>
                  </div>
                  <div className="row">
                    <dt>Markup</dt>
                    <dd id="r-markup">—</dd>
                  </div>
                  <div className="row">
                    <dt>Break-even sales (cover fixed costs)</dt>
                    <dd id="r-breakeven">—</dd>
                  </div>
                  <div className="row">
                    <dt>Sales to reach target monthly profit</dt>
                    <dd id="r-target-sales">—</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        </div>

        <div className="stack">
          {/* Pricing scenario table */}
          <section
            className="card scenario-card"
            id="scenario-section"
            aria-labelledby="scenario-heading"
            hidden
          >
            <h2 id="scenario-heading">Pricing scenarios</h2>
            <p className="hint">
              How your profit changes if you price above or below the calculated
              price.
            </p>
            <div className="table-wrap">
              <table className="scenario-table">
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Selling price</th>
                    <th scope="col">Total fees</th>
                    <th scope="col">Profit</th>
                    <th scope="col">Margin</th>
                  </tr>
                </thead>
                <tbody id="scenario-body" />
              </table>
            </div>
          </section>

          {/* Educational SEO section */}
          <section className="card seo-card" aria-labelledby="seo-heading">
            <h2 id="seo-heading">How to price for profit on Etsy</h2>

            <h3>Why Etsy sellers need to calculate profit, not just revenue</h3>
            <p>
              A sale on Etsy is not the same as profit. Between the transaction
              fee, payment processing, listing costs, and optional offsite ads,
              a meaningful slice of every order goes back to the platform. Add
              your materials, packaging, postage, and the value of your own
              time, and a sale that looks healthy can leave you with very
              little. This Etsy profit calculator separates revenue from real
              take-home profit so you know exactly where you stand.
            </p>

            <h3>How Etsy fees affect your pricing</h3>
            <p>
              Etsy fees are a mix of percentages and fixed amounts. Percentage
              fees grow with your price, while fixed fees (like the listing fee
              and the fixed part of payment processing) hit low-priced items
              hardest. That is why cheap items often feel impossible to make
              money on. Use the Etsy fee calculator above to see the true cost
              of each fee for any price point.
            </p>

            <h3>Why underpricing is so common</h3>
            <p>
              Many sellers set a price by glancing at competitors or doubling
              their material cost. This usually ignores labour, packaging,
              postage, and fees entirely. The result is steady sales with almost
              no profit. An Etsy profit margin calculator helps you set a price
              based on the margin you actually want to keep.
            </p>

            <h3>How to use this calculator</h3>
            <ol>
              <li>
                <strong>Calculate profit from selling price</strong> – enter a
                price and your costs to see your real profit and margin.
              </li>
              <li>
                <strong>Find price for target profit</strong> – tell it how much
                profit you want per sale and it works out the price to charge.
              </li>
              <li>
                <strong>Find price for target margin</strong> – set the margin
                percentage you want to keep and get the recommended selling
                price.
              </li>
            </ol>
            <p>
              Wondering <em>how much should I charge on Etsy</em>? Switch
              between the modes to compare approaches, then use the pricing
              scenario table to see how small price changes affect your bottom
              line.
            </p>
          </section>

          <section className="card link-card" aria-labelledby="csv-heading">
            <h2 id="csv-heading">Already selling?</h2>
            <p>
              This Etsy seller calculator is perfect for pricing a single
              product. If you are already trading and want to understand your
              real monthly profit across every order, our CSV Profit Calculator
              analyses your actual sales data.
            </p>
            <p>
              <Link
                className="btn btn-primary"
                href="/tools/csv-profit-calculator"
              >
                Use our CSV Profit Calculator
              </Link>
            </p>
          </section>

          <section className="disclaimers" aria-label="Disclaimers">
            <p>
              <strong>Trademark notice:</strong> This tool is not affiliated
              with, endorsed by, or associated with Etsy, Inc. Etsy is a
              trademark of Etsy, Inc.
            </p>
            <p>
              <strong>Estimates only:</strong> This calculator provides
              estimates only. Fees may vary by country, payment provider, tax
              rules, currency, and seller settings. Always verify your figures
              before making business decisions.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
