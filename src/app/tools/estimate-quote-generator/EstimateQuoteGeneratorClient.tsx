"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef } from "react";

const TOOLS_PAGES_HREF = "/pages/tools";

type JsPdfWindow = Window & {
  jspdf?: {
    jsPDF: new (opts?: { unit?: string; format?: string }) => JsPdfDoc;
  };
};

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFont: (family: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setFillColor: (r: number, g: number, b: number) => void;
  setLineWidth: (w: number) => void;
  text: (
    text: string | string[],
    x: number,
    y: number,
    opts?: { align?: "left" | "right" | "center" },
  ) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  splitTextToSize: (text: string, w: number) => string[];
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  addPage: () => void;
  save: (filename: string) => void;
};

type LogoState = {
  logoDataUrl: string | null;
  logoWidth: number;
  logoHeight: number;
};

type FieldValidator = (value: string) => string;

const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3MB
const MAX_LOGO_DIM = 400;

type StyleId =
  | "classic"
  | "modern"
  | "minimal"
  | "bold"
  | "elegant"
  | "corporate";

type StylePreset = {
  id: StyleId;
  layout: "classic" | "modern" | "minimal";
  accentRgb: [number, number, number];
  zebra?: boolean;
  serif?: boolean;
  sidebar?: boolean;
};

const STYLE_PRESETS: Record<string, StylePreset> = {
  classic: {
    id: "classic",
    layout: "classic",
    accentRgb: [17, 24, 39],
  },
  modern: {
    id: "modern",
    layout: "modern",
    accentRgb: [26, 127, 90],
    zebra: true,
  },
  minimal: {
    id: "minimal",
    layout: "minimal",
    accentRgb: [55, 65, 81],
  },
  bold: {
    id: "bold",
    layout: "modern",
    accentRgb: [49, 46, 129],
  },
  elegant: {
    id: "elegant",
    layout: "minimal",
    accentRgb: [127, 29, 29],
    serif: true,
  },
  corporate: {
    id: "corporate",
    layout: "classic",
    accentRgb: [30, 58, 138],
    sidebar: true,
  },
};

function setupEstimateQuoteGenerator(root: HTMLElement) {
  const documentRef = root.ownerDocument;
  const windowRef = documentRef.defaultView as JsPdfWindow | null;
  if (!windowRef) return () => undefined;

  const cleanupFns: Array<() => void> = [];

  const state: LogoState = {
    logoDataUrl: null,
    logoWidth: 0,
    logoHeight: 0,
  };

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

  // ---------- Utilities ----------
  const fmt = (n: number) => {
    const cur = ($("currency") as HTMLInputElement).value || "";
    const val = (Number.isFinite(n) ? n : 0).toFixed(2);
    return cur + val;
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const escapeHtml = (s: unknown) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[c];
    });

  function disableBrowserAutocomplete(container: ParentNode = root) {
    container
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >("input, textarea")
      .forEach((field) => {
        field.autocomplete = "off";
      });
  }

  function clearBrowserStorageForPrivacy() {
    if (!windowRef) return;

    // Privacy:
    // Only remove keys this tool may have touched (prefix "tool-estimate-").
    // Do NOT call storage.clear() — that would wipe unrelated keys belonging
    // to the rest of the site (e.g. theme preferences, consent flags).
    const removeToolKeys = (storage: Storage, label: string) => {
      try {
        const keysToRemove: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key && key.startsWith("tool-estimate-")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => storage.removeItem(key));
      } catch (err) {
        console.warn(
          `Estimate quote generator could not clear ${label} browser storage.`,
          err,
        );
      }
    };

    removeToolKeys(windowRef.localStorage, "local");
    removeToolKeys(windowRef.sessionStorage, "session");
  }

  function clearInPageDataForPrivacy() {
    try {
      state.logoDataUrl = null;
      state.logoWidth = 0;
      state.logoHeight = 0;

      root.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = false;
          return;
        }

        input.value = "";
      });
      root
        .querySelectorAll<HTMLTextAreaElement>("textarea")
        .forEach((field) => {
          field.value = "";
        });
      root.querySelectorAll<HTMLSelectElement>("select").forEach((field) => {
        field.selectedIndex = -1;
      });

      root
        .querySelectorAll<HTMLElement>("#itemsBody, #preview")
        .forEach((el) => {
          el.replaceChildren();
        });
      root
        .querySelectorAll<HTMLElement>(
          "#validationError, #logoError, #logoPreview",
        )
        .forEach((el) => {
          el.style.display = "none";
        });
      root
        .querySelector<HTMLImageElement>("#logoPreviewImg")
        ?.removeAttribute("src");
    } catch (err) {
      console.warn(
        "Estimate quote generator could not clear in-page browser data.",
        err,
      );
    }
  }

  function clearBrowserDataForPrivacy() {
    clearBrowserStorageForPrivacy();
    clearInPageDataForPrivacy();
  }

  disableBrowserAutocomplete();

  // ---------- Init defaults ----------
  ($("issueDate") as HTMLInputElement).value = todayISO();
  const d0 = new Date();
  d0.setDate(d0.getDate() + 30);
  ($("expiryDate") as HTMLInputElement).value = d0.toISOString().slice(0, 10);

  // ---------- Line items ----------
  function addRow(
    desc = "",
    qty: number | string = 1,
    price: number | string = 0,
  ) {
    const tr = documentRef.createElement("tr");
    tr.innerHTML = `
      <td data-label="Description"><input type="text" class="li-desc" placeholder="Item or service" value="${escapeHtml(desc)}" /></td>
      <td data-label="Qty"><input type="number" class="li-qty" min="0" step="any" inputmode="decimal" value="${qty}" /></td>
      <td data-label="Unit price"><input type="number" class="li-price" min="0" step="0.01" inputmode="decimal" value="${price}" /></td>
      <td class="line-total" data-label="Total">$0.00</td>
      <td class="row-actions"><button type="button" class="remove-row" aria-label="Remove line item" title="Remove">×</button></td>
    `;
    $("itemsBody").appendChild(tr);
    const removeBtn = tr.querySelector<HTMLButtonElement>(".remove-row");
    removeBtn?.addEventListener("click", () => {
      tr.remove();
      update();
    });
    disableBrowserAutocomplete(tr);
    tr.querySelectorAll<HTMLInputElement>("input").forEach((i) =>
      i.addEventListener("input", update),
    );
    wireLineItemValidation(tr);
    update();
  }

  on($("addRowBtn"), "click", () => addRow());

  // ---------- Totals calculation ----------
  function calcTotals() {
    const rows = Array.from(
      root.querySelectorAll<HTMLTableRowElement>("#itemsBody tr"),
    );
    let subtotal = 0;
    const items = rows.map((tr) => {
      const desc = (
        tr.querySelector(".li-desc") as HTMLInputElement
      ).value.trim();
      const qty =
        parseFloat((tr.querySelector(".li-qty") as HTMLInputElement).value) ||
        0;
      const price =
        parseFloat((tr.querySelector(".li-price") as HTMLInputElement).value) ||
        0;
      const total = qty * price;
      const totalCell = tr.querySelector(".line-total") as HTMLElement;
      totalCell.textContent = fmt(total);
      subtotal += total;
      return { desc, qty, price, total };
    });

    const discountVal =
      parseFloat(($("discount") as HTMLInputElement).value) || 0;
    const discountType = ($("discountType") as HTMLSelectElement).value;
    const discount =
      discountType === "percent" ? subtotal * (discountVal / 100) : discountVal;
    const afterDiscount = Math.max(0, subtotal - discount);
    const taxRate = parseFloat(($("taxRate") as HTMLInputElement).value) || 0;
    const tax = afterDiscount * (taxRate / 100);
    const grand = afterDiscount + tax;

    return { items, subtotal, discount, tax, grand, taxRate };
  }

  type Totals = ReturnType<typeof calcTotals>;

  // ---------- Update preview & totals ----------
  function update() {
    const t = calcTotals();
    $("sumSubtotal").textContent = fmt(t.subtotal);
    $("sumDiscount").textContent = "-" + fmt(t.discount);
    $("sumTax").textContent = fmt(t.tax);
    $("sumGrand").textContent = fmt(t.grand);
    renderPreview(t);
  }

  // ---------- Preview render ----------
  function getDocStyle(): StylePreset {
    const sel = root.querySelector<HTMLSelectElement>("#docStyle");
    return STYLE_PRESETS[sel?.value ?? "classic"] ?? STYLE_PRESETS.classic;
  }

  function renderPreview(t: Totals) {
    const docTypeEl = root.querySelector<HTMLInputElement>(
      'input[name="docType"]:checked',
    );
    const docType = docTypeEl ? docTypeEl.value : "Estimate";
    const style = getDocStyle();
    const logoPos = ($("logoPos") as HTMLSelectElement).value;
    const logoHtml = state.logoDataUrl
      ? `<div class="pd-logo"><img src="${state.logoDataUrl}" alt="Logo"/></div>`
      : "";
    const businessName = ($("bizName") as HTMLInputElement).value.trim();
    const businessLines = [
      ($("bizAddress") as HTMLTextAreaElement).value,
      ($("bizEmail") as HTMLInputElement).value,
      ($("bizPhone") as HTMLInputElement).value,
      ($("bizWebsite") as HTMLInputElement).value,
    ]
      .filter(Boolean)
      .map(escapeHtml)
      .join("<br/>");
    const businessBlock = `<div class="pd-business"><strong>${escapeHtml(businessName) || "Your Company"}</strong>${businessLines ? "<br/>" + businessLines : ""}</div>`;

    const clientName = ($("clientName") as HTMLInputElement).value.trim();
    const clientBiz = ($("clientBiz") as HTMLInputElement).value.trim();
    const clientAddr = ($("clientAddress") as HTMLTextAreaElement).value.trim();
    const clientEmail = ($("clientEmail") as HTMLInputElement).value.trim();
    const clientBlock = `<div class="pd-client">
        <div class="label">Bill to</div>
        ${clientBiz ? `<strong>${escapeHtml(clientBiz)}</strong><br/>` : ""}
        ${clientName ? escapeHtml(clientName) + "<br/>" : ""}
        ${clientAddr ? escapeHtml(clientAddr).replace(/\n/g, "<br/>") + "<br/>" : ""}
        ${clientEmail ? escapeHtml(clientEmail) : ""}
      </div>`;

    const rowsHtml =
      t.items
        .filter((i) => i.desc || i.qty || i.price)
        .map(
          (i) => `
      <tr>
        <td>${escapeHtml(i.desc)}</td>
        <td class="num">${i.qty}</td>
        <td class="num">${fmt(i.price)}</td>
        <td class="num">${fmt(i.total)}</td>
      </tr>
    `,
        )
        .join("") ||
      `<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:1rem;">No line items yet</td></tr>`;
    const tableBlock = `<table>
        <thead>
          <tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit price</th><th style="text-align:right;">Total</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;

    const totalsBlock = `<div class="pd-totals">
        <div><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
        ${t.discount > 0 ? `<div><span>Discount</span><span>-${fmt(t.discount)}</span></div>` : ""}
        ${t.taxRate > 0 ? `<div><span>Tax (${t.taxRate}%)</span><span>${fmt(t.tax)}</span></div>` : ""}
        <div class="grand"><span>Total</span><span>${fmt(t.grand)}</span></div>
      </div>`;

    const notes = ($("notes") as HTMLTextAreaElement).value.trim();
    const projectTitle = ($("projectTitle") as HTMLInputElement).value;
    const notesBlock = notes
      ? `<div class="pd-notes"><div class="label">Notes / Terms</div>${escapeHtml(notes)}</div>`
      : "";
    const projectBlock = projectTitle
      ? `<div class="pd-project"><strong>Project:</strong> ${escapeHtml(projectTitle)}</div>`
      : "";

    const docNumber = ($("docNumber") as HTMLInputElement).value;
    const issueDate = ($("issueDate") as HTMLInputElement).value;
    const expiryDate = ($("expiryDate") as HTMLInputElement).value;

    const previewEl = $("preview");
    previewEl.dataset.style = style.id;
    previewEl.dataset.layout = style.layout;
    previewEl.style.setProperty(
      "--accent",
      `rgb(${style.accentRgb[0]}, ${style.accentRgb[1]}, ${style.accentRgb[2]})`,
    );
    const tintRgb = (rgb: [number, number, number], amount: number) =>
      `rgb(${Math.round(rgb[0] + (255 - rgb[0]) * amount)}, ${Math.round(rgb[1] + (255 - rgb[1]) * amount)}, ${Math.round(rgb[2] + (255 - rgb[2]) * amount)})`;
    previewEl.style.setProperty(
      "--accent-tint",
      tintRgb(style.accentRgb, 0.92),
    );

    let headerHtml = "";
    if (style.layout === "modern") {
      headerHtml = `
        <div class="pd-band">
          <div class="pd-band-title">${escapeHtml(docType).toUpperCase()}</div>
          <div class="pd-band-meta">
            <div><span>No.</span> <strong>${escapeHtml(docNumber)}</strong></div>
            <div><span>Issued</span> <strong>${escapeHtml(issueDate)}</strong></div>
            <div><span>Valid until</span> <strong>${escapeHtml(expiryDate)}</strong></div>
          </div>
        </div>
        <div class="pd-modern-row">
          ${logoHtml}
          ${businessBlock}
        </div>
      `;
    } else if (style.layout === "minimal") {
      const metaInline = [
        docNumber ? `No. ${escapeHtml(docNumber)}` : "",
        issueDate ? `Issued ${escapeHtml(issueDate)}` : "",
        expiryDate ? `Valid until ${escapeHtml(expiryDate)}` : "",
      ]
        .filter(Boolean)
        .join(" &middot; ");
      headerHtml = `
        <div class="pd-minimal-head">
          <h3>${escapeHtml(docType)}</h3>
          <div class="pd-minimal-meta">${metaInline}</div>
        </div>
        <div class="pd-minimal-cols">
          <div>${logoHtml}${businessBlock}</div>
          ${clientBlock}
        </div>
      `;
    } else {
      headerHtml = `
        <div class="pd-header ${logoPos === "right" ? "right-logo" : ""}">
          ${logoHtml || businessBlock}
          <div style="text-align:right;">
            <h3>${escapeHtml(docType).toUpperCase()}</h3>
            <div class="pd-meta" style="margin-top:0.5rem; text-align:left;">
              <div><span>Number:</span><strong>${escapeHtml(docNumber)}</strong></div>
              <div><span>Issued:</span><strong>${escapeHtml(issueDate)}</strong></div>
              <div><span>Valid until:</span><strong>${escapeHtml(expiryDate)}</strong></div>
            </div>
          </div>
        </div>
        ${
          state.logoDataUrl && businessName
            ? `<div class="pd-business" style="margin-bottom:1rem;"><strong>${escapeHtml(businessName)}</strong>${businessLines ? "<br/>" + businessLines : ""}</div>`
            : ""
        }
      `;
    }

    const showClientAfterHeader = style.layout !== "minimal";
    previewEl.innerHTML = `
      ${headerHtml}
      ${showClientAfterHeader ? clientBlock : ""}
      ${projectBlock}
      ${tableBlock}
      ${totalsBlock}
      ${notesBlock}
    `;
  }

  // ---------- Bind live update to all relevant inputs ----------
  const liveInputs = [
    "bizName",
    "bizEmail",
    "bizPhone",
    "bizWebsite",
    "bizAddress",
    "clientName",
    "clientBiz",
    "clientEmail",
    "clientAddress",
    "docNumber",
    "issueDate",
    "expiryDate",
    "projectTitle",
    "notes",
    "discount",
    "discountType",
    "taxRate",
    "currency",
    "logoPos",
    "docStyle",
  ];
  liveInputs.forEach((id) => on($(id), "input", update));
  root
    .querySelectorAll<HTMLInputElement>('input[name="docType"]')
    .forEach((r) => on(r, "change", update));
  on($("docStyle"), "change", update);

  // ---------- Logo upload ----------
  on($("logoFile"), "change", (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    const errEl = $("logoError");
    errEl.style.display = "none";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      errEl.textContent = "Please select a valid image file.";
      errEl.style.display = "block";
      target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      errEl.textContent = `Logo is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum 3MB.`;
      errEl.style.display = "block";
      target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(MAX_LOGO_DIM / width, MAX_LOGO_DIM / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = documentRef.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        state.logoDataUrl = canvas.toDataURL("image/png");
        state.logoWidth = width;
        state.logoHeight = height;
        ($("logoPreviewImg") as HTMLImageElement).src = state.logoDataUrl;
        ($("logoPreview") as HTMLElement).style.display = "flex";
        reRunBizNameIfTouched();
        update();
      };
      img.onerror = () => {
        errEl.textContent = "Could not read this image file.";
        errEl.style.display = "block";
      };
      img.src = String(ev.target?.result ?? "");
    };
    reader.readAsDataURL(file);
  });

  on($("logoRemove"), "click", () => {
    state.logoDataUrl = null;
    state.logoWidth = 0;
    state.logoHeight = 0;
    ($("logoFile") as HTMLInputElement).value = "";
    ($("logoPreview") as HTMLElement).style.display = "none";
    reRunBizNameIfTouched();
    update();
  });

  // ---------- Validation ----------
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const RE_URL = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;
  const RE_PHONE = /^[+\d][\d\s\-().]{5,}$/;

  const fieldValidators: Record<string, FieldValidator> = {
    bizName: (v) =>
      !v.trim() && !state.logoDataUrl
        ? "Enter a company name (or upload a logo)."
        : "",
    bizEmail: (v) =>
      v.trim() && !RE_EMAIL.test(v.trim())
        ? "Enter a valid email, e.g. hello@acme.co."
        : "",
    bizPhone: (v) =>
      v.trim() && !RE_PHONE.test(v.trim()) ? "Enter a valid phone number." : "",
    bizWebsite: (v) =>
      v.trim() && !RE_URL.test(v.trim())
        ? "Enter a valid website, e.g. acme.co."
        : "",
    clientName: () => crossCheckClient(),
    clientBiz: () => crossCheckClient(),
    clientEmail: (v) =>
      v.trim() && !RE_EMAIL.test(v.trim())
        ? "Enter a valid email address."
        : "",
    docNumber: (v) => (!v.trim() ? "Document number is required." : ""),
    issueDate: (v) => (!v ? "Pick an issue date." : ""),
    expiryDate: (v) => {
      if (!v) return "";
      const issue = ($("issueDate") as HTMLInputElement).value;
      if (issue && v < issue)
        return "Valid-until date must be on or after the issue date.";
      return "";
    },
    discount: (v) => {
      const n = parseFloat(v);
      if (v === "" || isNaN(n)) return "";
      if (n < 0) return "Discount cannot be negative.";
      if (
        ($("discountType") as HTMLSelectElement).value === "percent" &&
        n > 100
      )
        return "Percent discount cannot exceed 100%.";
      return "";
    },
    taxRate: (v) => {
      const n = parseFloat(v);
      if (v === "" || isNaN(n)) return "";
      if (n < 0) return "Tax rate cannot be negative.";
      if (n > 100) return "Tax rate cannot exceed 100%.";
      return "";
    },
    currency: (v) =>
      !v.trim() ? "Enter a currency symbol (e.g. $, £, €)." : "",
  };

  function crossCheckClient() {
    const name = ($("clientName") as HTMLInputElement).value.trim();
    const biz = ($("clientBiz") as HTMLInputElement).value.trim();
    return !name && !biz ? "Enter a client name or client business name." : "";
  }

  function getHintEl(input: HTMLElement) {
    const parent = input.parentElement;
    if (!parent) throw new Error("Field has no parent");
    let hint = parent.querySelector<HTMLElement>(":scope > .field-hint");
    if (!hint) {
      hint = documentRef.createElement("div");
      hint.className = "field-hint";
      hint.id = input.id + "-hint";
      input.setAttribute("aria-describedby", hint.id);
      parent.appendChild(hint);
    }
    return hint;
  }

  function setFieldError(input: HTMLElement, message: string) {
    const hint = getHintEl(input);
    if (message) {
      input.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      hint.textContent = message;
      hint.classList.add("show");
    } else {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      hint.classList.remove("show");
      hint.textContent = "";
    }
  }

  function runFieldValidator(id: string) {
    const input = root.querySelector<HTMLInputElement>("#" + id);
    if (!input) return "";
    const validator = fieldValidators[id];
    if (!validator) return "";
    const msg = validator(input.value);
    if (input.classList.contains("touched")) {
      setFieldError(input, msg);
    }
    return msg;
  }

  function reRunClientPair() {
    ["clientName", "clientBiz"].forEach((id) => {
      const input = $(id);
      if (input.classList.contains("touched")) runFieldValidator(id);
    });
  }

  Object.keys(fieldValidators).forEach((id) => {
    const input = root.querySelector<HTMLInputElement>("#" + id);
    if (!input) return;
    on(input, "blur", () => {
      input.classList.add("touched");
      runFieldValidator(id);
      if (id === "clientName" || id === "clientBiz") reRunClientPair();
    });
    on(input, "input", () => {
      if (input.classList.contains("touched")) runFieldValidator(id);
      if (id === "clientName" || id === "clientBiz") reRunClientPair();
    });
  });

  on($("issueDate"), "change", () => {
    ($("expiryDate") as HTMLInputElement).min =
      ($("issueDate") as HTMLInputElement).value || "";
    if ($("expiryDate").classList.contains("touched"))
      runFieldValidator("expiryDate");
  });
  ($("expiryDate") as HTMLInputElement).min =
    ($("issueDate") as HTMLInputElement).value || "";

  on($("discountType"), "change", () => {
    if ($("discount").classList.contains("touched"))
      runFieldValidator("discount");
  });

  function reRunBizNameIfTouched() {
    if ($("bizName").classList.contains("touched"))
      runFieldValidator("bizName");
  }

  function validateLineItemRow(tr: HTMLTableRowElement) {
    const descEl = tr.querySelector(".li-desc") as HTMLInputElement;
    const qtyEl = tr.querySelector(".li-qty") as HTMLInputElement;
    const priceEl = tr.querySelector(".li-price") as HTMLInputElement;
    const qty = parseFloat(qtyEl.value);
    const price = parseFloat(priceEl.value);

    if (qtyEl.classList.contains("touched")) {
      setFieldError(
        qtyEl,
        qtyEl.value !== "" && (isNaN(qty) || qty < 0)
          ? "Quantity must be 0 or more."
          : "",
      );
    }
    if (priceEl.classList.contains("touched")) {
      setFieldError(
        priceEl,
        priceEl.value !== "" && (isNaN(price) || price < 0)
          ? "Price must be 0 or more."
          : "",
      );
    }
    if (descEl.classList.contains("touched")) {
      const hasNumbers = qty > 0 || price > 0;
      setFieldError(
        descEl,
        hasNumbers && !descEl.value.trim()
          ? "Add a description for this line item."
          : "",
      );
    }
  }

  function wireLineItemValidation(tr: HTMLTableRowElement) {
    tr.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      input.addEventListener("blur", () => {
        input.classList.add("touched");
        validateLineItemRow(tr);
      });
      input.addEventListener("input", () => {
        if (input.classList.contains("touched")) validateLineItemRow(tr);
      });
    });
  }

  function validate() {
    const errors: string[] = [];
    const seen = new Set<string>();

    Object.keys(fieldValidators).forEach((id) => {
      const input = root.querySelector<HTMLInputElement>("#" + id);
      if (!input) return;
      input.classList.add("touched");
      const msg = fieldValidators[id](input.value);
      setFieldError(input, msg);
      if (msg && !seen.has(msg)) {
        errors.push(msg);
        seen.add(msg);
      }
    });

    const docType = root.querySelector<HTMLInputElement>(
      'input[name="docType"]:checked',
    );
    if (!docType) errors.push("Select a document type (Estimate or Quote).");

    let hasValidItem = false;
    root
      .querySelectorAll<HTMLTableRowElement>("#itemsBody tr")
      .forEach((tr) => {
        tr.querySelectorAll<HTMLInputElement>("input").forEach((i) =>
          i.classList.add("touched"),
        );
        validateLineItemRow(tr);
        const desc = (
          tr.querySelector(".li-desc") as HTMLInputElement
        ).value.trim();
        const qty =
          parseFloat((tr.querySelector(".li-qty") as HTMLInputElement).value) ||
          0;
        if (desc && qty > 0) hasValidItem = true;
      });
    if (!hasValidItem) {
      const msg =
        "Add at least one line item with a description and a quantity greater than 0.";
      if (!seen.has(msg)) errors.push(msg);
    }
    return errors;
  }

  // ---------- PDF generation ----------
  on($("downloadBtn"), "click", () => {
    const errEl = $("validationError");
    const errors = validate();
    if (errors.length) {
      const heading =
        errors.length === 1
          ? "Please fix this before downloading:"
          : `Please fix the following ${errors.length} issues before downloading:`;
      errEl.innerHTML =
        `<strong>${heading}</strong><ul>` +
        errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("") +
        "</ul>";
      errEl.style.display = "block";
      errEl.setAttribute("role", "alert");
      const firstInvalid = root.querySelector<HTMLElement>(
        "#itemsBody input.is-invalid, input.is-invalid, select.is-invalid, textarea.is-invalid",
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        windowRef.setTimeout(
          () => firstInvalid.focus({ preventScroll: true }),
          350,
        );
      } else {
        errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    errEl.style.display = "none";
    generatePDF();
  });

  function generatePDF() {
    const jspdf = windowRef?.jspdf;
    if (!jspdf) {
      const errEl = $("validationError");
      errEl.textContent =
        "PDF library is still loading. Please try again in a moment.";
      errEl.style.display = "block";
      return;
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const SP = {
      section: 28,
      block: 14,
      line: 14,
      lineSm: 12,
      rowPadV: 10,
    };
    let y = margin;

    const docTypeEl = root.querySelector<HTMLInputElement>(
      'input[name="docType"]:checked',
    );
    const docType = docTypeEl ? docTypeEl.value : "Estimate";
    const style = getDocStyle();
    const logoPos = ($("logoPos") as HTMLSelectElement).value;
    const businessName = ($("bizName") as HTMLInputElement).value.trim();
    const bizAddress = ($("bizAddress") as HTMLTextAreaElement).value;
    const bizEmail = ($("bizEmail") as HTMLInputElement).value;
    const bizPhone = ($("bizPhone") as HTMLInputElement).value;
    const bizWebsite = ($("bizWebsite") as HTMLInputElement).value;
    const docNumber = ($("docNumber") as HTMLInputElement).value;
    const issueDate = ($("issueDate") as HTMLInputElement).value;
    const expiryDate = ($("expiryDate") as HTMLInputElement).value;
    const t = calcTotals();
    const font = style.serif ? "times" : "helvetica";

    const tint = (
      rgb: [number, number, number],
      amount = 0.92,
    ): [number, number, number] => [
      Math.round(rgb[0] + (255 - rgb[0]) * amount),
      Math.round(rgb[1] + (255 - rgb[1]) * amount),
      Math.round(rgb[2] + (255 - rgb[2]) * amount),
    ];

    // -------------------- HEADER (per style) --------------------
    if (style.sidebar) {
      doc.setFillColor(
        style.accentRgb[0],
        style.accentRgb[1],
        style.accentRgb[2],
      );
      doc.rect(0, 0, 10, pageH, "F");
    }
    if (style.layout === "modern") {
      // Full-width accent band with title + meta inside it
      const bandH = 90;
      doc.setFillColor(
        style.accentRgb[0],
        style.accentRgb[1],
        style.accentRgb[2],
      );
      doc.rect(0, 0, pageW, bandH, "F");
      doc.setFont(font, "bold");
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(docType.toUpperCase(), margin, 48);
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      [
        `No. ${docNumber}`,
        `Issued ${issueDate}`,
        `Valid until ${expiryDate}`,
      ].forEach((l, i) => {
        doc.text(l, pageW - margin, 30 + i * 16, { align: "right" });
      });
      y = bandH + SP.section;

      // Logo + business below band
      let bizY = y;
      if (state.logoDataUrl) {
        const maxW = 130;
        const maxH = 60;
        const ratio = Math.min(maxW / state.logoWidth, maxH / state.logoHeight);
        const w = state.logoWidth * ratio;
        const h = state.logoHeight * ratio;
        try {
          doc.addImage(state.logoDataUrl, "PNG", margin, y, w, h);
          bizY = y + h + 8;
        } catch (err) {
          console.warn("Logo render failed:", err);
        }
      }
      if (businessName) {
        doc.setFont(font, "bold");
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text(businessName, margin, bizY);
        bizY += SP.line + 2;
      }
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      [bizAddress, bizEmail, bizPhone, bizWebsite]
        .filter(Boolean)
        .forEach((line) => {
          line.split("\n").forEach((seg) => {
            doc.text(seg, margin, bizY);
            bizY += SP.line;
          });
        });
      y = bizY + SP.section;
    } else if (style.layout === "minimal") {
      // Centered title between two hairlines, inline meta below
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      y += 26;
      doc.setFont(font, "normal");
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      doc.text(docType, pageW / 2, y, { align: "center" });
      y += 10;
      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const metaInline = [
        docNumber ? `No. ${docNumber}` : "",
        issueDate ? `Issued ${issueDate}` : "",
        expiryDate ? `Valid until ${expiryDate}` : "",
      ]
        .filter(Boolean)
        .join("  \u00B7  ");
      doc.text(metaInline, pageW / 2, y + 14, { align: "center" });
      y += 28;
      doc.line(margin, y, pageW - margin, y);
      doc.setLineWidth(0.2);
      y += SP.section;

      // Business + client side-by-side (two columns)
      const colGap = 30;
      const colW = (pageW - margin * 2 - colGap) / 2;
      const leftX = margin;
      const rightX = margin + colW + colGap;
      let leftY = y;
      let rightY = y;

      if (state.logoDataUrl) {
        const maxW = 100;
        const maxH = 50;
        const ratio = Math.min(maxW / state.logoWidth, maxH / state.logoHeight);
        const w = state.logoWidth * ratio;
        const h = state.logoHeight * ratio;
        try {
          doc.addImage(state.logoDataUrl, "PNG", leftX, leftY, w, h);
          leftY += h + 8;
        } catch (err) {
          console.warn("Logo render failed:", err);
        }
      }
      if (businessName) {
        doc.setFont(font, "bold");
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text(businessName, leftX, leftY);
        leftY += SP.line + 2;
      }
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      [bizAddress, bizEmail, bizPhone, bizWebsite]
        .filter(Boolean)
        .forEach((line) => {
          line.split("\n").forEach((seg) => {
            doc.text(seg, leftX, leftY);
            leftY += SP.line;
          });
        });

      // Right column: client
      doc.setFont(font, "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("BILL TO", rightX, rightY);
      rightY += SP.line + 2;
      const clientBizV = ($("clientBiz") as HTMLInputElement).value.trim();
      const clientNameV = ($("clientName") as HTMLInputElement).value.trim();
      const clientAddrV = (
        $("clientAddress") as HTMLTextAreaElement
      ).value.trim();
      const clientEmailV = ($("clientEmail") as HTMLInputElement).value.trim();
      if (clientBizV) {
        doc.setFont(font, "bold");
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text(clientBizV, rightX, rightY);
        rightY += SP.line + 1;
      }
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      if (clientNameV) {
        doc.text(clientNameV, rightX, rightY);
        rightY += SP.line;
      }
      if (clientAddrV) {
        clientAddrV.split("\n").forEach((line) => {
          doc.text(line, rightX, rightY);
          rightY += SP.line;
        });
      }
      if (clientEmailV) {
        doc.text(clientEmailV, rightX, rightY);
        rightY += SP.line;
      }

      y = Math.max(leftY, rightY) + SP.section;
    } else {
      // CLASSIC — current layout
      let logoBottom = y;
      if (state.logoDataUrl) {
        const maxW = 130;
        const maxH = 65;
        const ratio = Math.min(maxW / state.logoWidth, maxH / state.logoHeight);
        const w = state.logoWidth * ratio;
        const h = state.logoHeight * ratio;
        const x = logoPos === "right" ? pageW - margin - w : margin;
        try {
          doc.addImage(state.logoDataUrl, "PNG", x, y, w, h);
          logoBottom = y + h;
        } catch (err) {
          console.warn("Logo render failed:", err);
        }
      }

      doc.setFont(font, "bold");
      doc.setFontSize(24);
      doc.setTextColor(17, 24, 39);
      const titleX =
        logoPos === "right" && state.logoDataUrl ? margin : pageW - margin;
      const titleAlign: "left" | "right" =
        logoPos === "right" && state.logoDataUrl ? "left" : "right";
      doc.text(docType.toUpperCase(), titleX, y + 22, { align: titleAlign });

      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      [
        `Number: ${docNumber}`,
        `Issued: ${issueDate}`,
        `Valid until: ${expiryDate}`,
      ].forEach((l, i) => {
        doc.text(l, titleX, y + 44 + i * 14, { align: titleAlign });
      });

      y = Math.max(logoBottom, y + 90) + SP.section;

      if (businessName || bizAddress || bizEmail || bizPhone || bizWebsite) {
        doc.setFont(font, "bold");
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        if (businessName) {
          doc.text(businessName, margin, y);
          y += SP.line + 2;
        }
        doc.setFont(font, "normal");
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        [bizAddress, bizEmail, bizPhone, bizWebsite]
          .filter(Boolean)
          .forEach((line) => {
            line.split("\n").forEach((seg) => {
              doc.text(seg, margin, y);
              y += SP.line;
            });
          });
        y += SP.section;
      }
    }

    // -------------------- BILL TO (classic + modern only; minimal already drew it) --------------------
    if (style.layout !== "minimal") {
      doc.setFont(font, "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("BILL TO", margin, y);
      y += SP.line + 2;
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      if (($("clientBiz") as HTMLInputElement).value.trim()) {
        doc.text(($("clientBiz") as HTMLInputElement).value.trim(), margin, y);
        y += SP.line + 1;
      }
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      if (($("clientName") as HTMLInputElement).value.trim()) {
        doc.text(($("clientName") as HTMLInputElement).value.trim(), margin, y);
        y += SP.line;
      }
      if (($("clientAddress") as HTMLTextAreaElement).value.trim()) {
        ($("clientAddress") as HTMLTextAreaElement).value
          .trim()
          .split("\n")
          .forEach((line) => {
            doc.text(line, margin, y);
            y += SP.line;
          });
      }
      if (($("clientEmail") as HTMLInputElement).value.trim()) {
        doc.text(
          ($("clientEmail") as HTMLInputElement).value.trim(),
          margin,
          y,
        );
        y += SP.line;
      }
      y += SP.section;
    }

    if (($("projectTitle") as HTMLInputElement).value.trim()) {
      doc.setFont(font, "bold");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("Project:", margin, y);
      doc.setFont(font, "normal");
      doc.text(
        ($("projectTitle") as HTMLInputElement).value.trim(),
        margin + 55,
        y,
      );
      y += SP.section;
    }

    // -------------------- ITEMS TABLE (per style) --------------------
    const colX = {
      desc: margin,
      qty: pageW - margin - 270,
      price: pageW - margin - 180,
      total: pageW - margin,
    };
    const colW = {
      desc: colX.qty - colX.desc - 14,
    };

    const headerH = 24;
    if (style.layout === "modern") {
      // No fill; accent underline rule below header text
      doc.setFont(font, "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        style.accentRgb[0],
        style.accentRgb[1],
        style.accentRgb[2],
      );
      doc.text("DESCRIPTION", colX.desc + 6, y + 16);
      doc.text("QTY", colX.qty, y + 16, { align: "right" });
      doc.text("UNIT PRICE", colX.price, y + 16, { align: "right" });
      doc.text("TOTAL", colX.total - 6, y + 16, { align: "right" });
      y += headerH;
      doc.setDrawColor(
        style.accentRgb[0],
        style.accentRgb[1],
        style.accentRgb[2],
      );
      doc.setLineWidth(1.2);
      doc.line(margin, y, pageW - margin, y);
      doc.setLineWidth(0.2);
    } else if (style.layout === "minimal") {
      // Borderless small-caps headings; thin gray underline only
      doc.setFont(font, "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Description", colX.desc, y + 14);
      doc.text("Qty", colX.qty, y + 14, { align: "right" });
      doc.text("Unit price", colX.price, y + 14, { align: "right" });
      doc.text("Total", colX.total, y + 14, { align: "right" });
      y += headerH - 4;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      doc.setLineWidth(0.2);
    } else {
      // CLASSIC
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y, pageW - margin * 2, headerH, "F");
      doc.setFont(font, "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const headerTextY = y + 16;
      doc.text("DESCRIPTION", colX.desc + 6, headerTextY);
      doc.text("QTY", colX.qty, headerTextY, { align: "right" });
      doc.text("UNIT PRICE", colX.price, headerTextY, { align: "right" });
      doc.text("TOTAL", colX.total - 6, headerTextY, { align: "right" });
      y += headerH;
    }

    doc.setFont(font, "normal");
    doc.setFontSize(style.layout === "minimal" ? 9.5 : 10);
    doc.setTextColor(17, 24, 39);

    const validItems = t.items.filter((i) => i.desc && i.qty > 0);
    const descLeft = style.layout === "minimal" ? colX.desc : colX.desc + 6;
    const totalRight = style.layout === "minimal" ? colX.total : colX.total - 6;
    const rowPad = style.layout === "minimal" ? 6 : SP.rowPadV;
    validItems.forEach((item, idx) => {
      const descLines = doc.splitTextToSize(
        item.desc,
        style.layout === "minimal" ? colW.desc + 6 : colW.desc,
      );
      const rowH = Math.max(
        style.layout === "minimal" ? 20 : 26,
        descLines.length * SP.line + rowPad * 2,
      );

      if (y + rowH > pageH - margin - 140) {
        doc.addPage();
        y = margin;
      }

      // Zebra striping for modern
      if (style.zebra && idx % 2 === 1) {
        const tinted = tint(style.accentRgb, 0.94);
        doc.setFillColor(tinted[0], tinted[1], tinted[2]);
        doc.rect(margin, y, pageW - margin * 2, rowH, "F");
      }

      const textY = y + rowPad + 4;
      doc.setTextColor(17, 24, 39);
      doc.text(descLines, descLeft, textY);
      doc.text(String(item.qty), colX.qty, textY, { align: "right" });
      doc.text(fmt(item.price), colX.price, textY, { align: "right" });
      doc.text(fmt(item.total), totalRight, textY, { align: "right" });
      y += rowH;

      if (style.layout === "minimal") {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
      } else if (style.layout === "classic") {
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, y, pageW - margin, y);
      } else if (style.layout === "modern" && !style.zebra) {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
      }
      // modern w/ zebra: no per-row rule, zebra fill carries it
    });
    doc.setLineWidth(0.2);

    y += SP.section;

    // -------------------- TOTALS (per style) --------------------
    const totalsX = pageW - margin - 200;
    const totalsValueX = pageW - margin;

    const drawTotalRow = (
      label: string,
      value: string,
      opts?: { bold?: boolean; color?: [number, number, number] },
    ) => {
      const bold = !!opts?.bold;
      if (y > pageH - margin - 50) {
        doc.addPage();
        y = margin;
      }
      doc.setFont(font, bold ? "bold" : "normal");
      doc.setFontSize(bold ? 12 : 10);
      const c = opts?.color ?? [17, 24, 39];
      doc.setTextColor(c[0], c[1], c[2]);
      doc.text(label, totalsX, y);
      doc.text(value, totalsValueX, y, { align: "right" });
      y += bold ? 20 : 16;
    };

    drawTotalRow("Subtotal", fmt(t.subtotal));
    if (t.discount > 0) drawTotalRow("Discount", "-" + fmt(t.discount));
    if (t.taxRate > 0) drawTotalRow(`Tax (${t.taxRate}%)`, fmt(t.tax));

    if (style.layout === "modern") {
      // Accent-filled pill for grand total
      y += 6;
      const pillH = 26;
      doc.setFillColor(
        style.accentRgb[0],
        style.accentRgb[1],
        style.accentRgb[2],
      );
      doc.rect(totalsX - 10, y - 2, totalsValueX - totalsX + 20, pillH, "F");
      doc.setFont(font, "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL", totalsX, y + 16);
      doc.text(fmt(t.grand), totalsValueX - 4, y + 16, { align: "right" });
      y += pillH + 4;
    } else if (style.layout === "minimal") {
      // Thin rule, plain text TOTAL
      y += 6;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.5);
      doc.line(totalsX, y, totalsValueX, y);
      y += 14;
      doc.setFont(font, "normal");
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text("Total", totalsX, y);
      doc.text(fmt(t.grand), totalsValueX, y, { align: "right" });
      y += 20;
      doc.setLineWidth(0.2);
    } else {
      // CLASSIC — accent rule then bold TOTAL row
      y += 4;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1);
      doc.line(totalsX, y - 4, totalsValueX, y - 4);
      y += 8;
      drawTotalRow("TOTAL", fmt(t.grand), { bold: true });
      doc.setLineWidth(0.2);
    }

    const notesVal = ($("notes") as HTMLTextAreaElement).value.trim();
    if (notesVal) {
      y += SP.section;
      if (y > pageH - margin - 80) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y, pageW - margin, y);
      y += SP.section - 6;
      doc.setFont(font, "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("NOTES / TERMS", margin, y);
      y += SP.line + 4;
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      const noteLines = doc.splitTextToSize(notesVal, pageW - margin * 2);
      noteLines.forEach((line) => {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += SP.line;
      });
    }

    const num = (docNumber || "001").replace(/[^a-zA-Z0-9\-_]/g, "");
    const filename = `${docType.toLowerCase()}-${num}.pdf`;
    doc.save(filename);
  }

  // ---------- Reset ----------
  // Privacy:
  // The Reset button only clears this tool's form fields, line items, and
  // in-memory logo state. It must NOT touch any browser storage outside the
  // "tool-estimate-" prefix scope handled by clearBrowserStorageForPrivacy.
  on($("resetBtn"), "click", () => {
    if (!windowRef.confirm("Reset the entire form? This cannot be undone."))
      return;
    root
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea')
      .forEach((i) => {
        i.value = "";
      });
    ($("docNumber") as HTMLInputElement).value = "001";
    ($("currency") as HTMLInputElement).value = "$";
    ($("discount") as HTMLInputElement).value = "0";
    ($("taxRate") as HTMLInputElement).value = "0";
    ($("discountType") as HTMLSelectElement).value = "amount";
    ($("logoPos") as HTMLSelectElement).value = "left";
    ($("docStyle") as HTMLSelectElement).value = "classic";
    ($("issueDate") as HTMLInputElement).value = todayISO();
    const dd = new Date();
    dd.setDate(dd.getDate() + 30);
    ($("expiryDate") as HTMLInputElement).value = dd.toISOString().slice(0, 10);
    const estimateRadio = root.querySelector<HTMLInputElement>(
      'input[name="docType"][value="Estimate"]',
    );
    if (estimateRadio) estimateRadio.checked = true;
    state.logoDataUrl = null;
    state.logoWidth = 0;
    state.logoHeight = 0;
    ($("logoFile") as HTMLInputElement).value = "";
    ($("logoPreview") as HTMLElement).style.display = "none";
    ($("logoError") as HTMLElement).style.display = "none";
    ($("validationError") as HTMLElement).style.display = "none";
    root
      .querySelectorAll(".is-invalid, .touched")
      .forEach((el) => el.classList.remove("is-invalid", "touched"));
    root
      .querySelectorAll(".field-hint.show")
      .forEach((el) => el.classList.remove("show"));
    ($("itemsBody") as HTMLElement).innerHTML = "";
    addRow();
  });

  // ---------- Mobile preview jump ----------
  on($("previewJump"), "click", () => {
    $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  on(windowRef, "pagehide", clearBrowserDataForPrivacy);

  // Start with one empty row + first render
  addRow();
  update();

  return () => {
    clearBrowserDataForPrivacy();
    cleanupFns.forEach((fn) => fn());
  };
}

export default function EstimateQuoteGeneratorClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    return setupEstimateQuoteGenerator(rootRef.current);
  }, []);

  return (
    <>
      {/*
        Third-party script kept (not migrated to an npm ES import):
        jsPDF is served from /public/vendor/jspdf.umd.min.js, which is a
        self-hosted, version-pinned bundle. This deliberately avoids any
        external CDN request and keeps the tool fully self-contained for
        privacy. Library exposes itself on `window.jspdf` and is consumed
        synchronously inside the PDF generation handler, which is awkward
        to refactor into a top-level ES import without changing behaviour.
        If migrating to `import { jsPDF } from "jspdf"`, verify that the
        TypeScript surface and signing of the generated PDF remain identical.
      */}
      <Script src="/vendor/jspdf.umd.min.js" strategy="afterInteractive" />
      <div ref={rootRef} className="estimate-quote-generator-page">
        <a className="skip-link" href="#docType">
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
              <li aria-current="page">Estimate &amp; Quote PDF Generator</li>
            </ol>
          </nav>

          <section className="tool-hero" aria-labelledby="hero-heading">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Free tool · No sign-up · 100% private
            </span>
            <h1 id="hero-heading">Estimate &amp; Quote PDF Generator</h1>
            <p>
              Build a professional estimate or quote and download it as a PDF.
              Everything runs in your browser — nothing is uploaded or stored.
            </p>
          </section>

          <aside
            className="card privacy-warning-card"
            aria-label="Privacy reminder"
          >
            <p>
              <strong>Privacy reminder:</strong> Your estimate or quote details
              stay in this browser while you work and are cleared when this page
              session closes. On a shared or public device, close the tab or
              window when you are done.
            </p>
          </aside>

          <div className="container">
            {/* ============ FORM COLUMN ============ */}
            <div className="form-col">
              <section className="card">
                <h2>Document Type</h2>
                <div className="doc-type" id="docType">
                  <label>
                    <input
                      type="radio"
                      name="docType"
                      value="Estimate"
                      defaultChecked
                    />
                    <span>Estimate</span>
                  </label>
                  <label>
                    <input type="radio" name="docType" value="Quote" />
                    <span>Quote</span>
                  </label>
                </div>
                <div className="form-row" style={{ marginTop: "0.75rem" }}>
                  <div>
                    <label htmlFor="docStyle">Style</label>
                    <select id="docStyle" defaultValue="classic">
                      <option value="classic">Classic</option>
                      <option value="modern">Modern</option>
                      <option value="minimal">Minimal</option>
                      <option value="bold">Bold</option>
                      <option value="elegant">Elegant</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>Your Business Details</h2>
                <div className="form-row two">
                  <div>
                    <label htmlFor="bizName">Company name *</label>
                    <input type="text" id="bizName" placeholder="Acme Co." />
                  </div>
                  <div>
                    <label htmlFor="bizEmail">Email</label>
                    <input
                      type="email"
                      id="bizEmail"
                      placeholder="hello@acme.co"
                    />
                  </div>
                </div>
                <div className="form-row two">
                  <div>
                    <label htmlFor="bizPhone">Phone</label>
                    <input
                      type="tel"
                      id="bizPhone"
                      placeholder="+1 555 000 1234"
                    />
                  </div>
                  <div>
                    <label htmlFor="bizWebsite">Website</label>
                    <input type="url" id="bizWebsite" placeholder="acme.co" />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label htmlFor="bizAddress">Address</label>
                    <textarea
                      id="bizAddress"
                      placeholder="Street, City, ZIP, Country"
                    />
                  </div>
                </div>

                <div className="form-row two">
                  <div>
                    <label htmlFor="logoFile">Logo (optional)</label>
                    <input
                      type="file"
                      id="logoFile"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    />
                    <div
                      id="logoError"
                      className="field-error"
                      style={{ display: "none" }}
                    />
                    <div
                      className="logo-preview"
                      id="logoPreview"
                      style={{ display: "none" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img id="logoPreviewImg" alt="Logo preview" />
                      <button
                        type="button"
                        className="logo-remove"
                        id="logoRemove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="logoPos">Logo position</label>
                    <select id="logoPos" defaultValue="left">
                      <option value="left">Top left</option>
                      <option value="right">Top right</option>
                    </select>
                  </div>
                </div>
                <div className="privacy-note" role="note">
                  {/*
                    Privacy:
                    Business details, client details, logo image and all
                    line-item data live only in React/DOM state on the user's
                    device. Nothing here is transmitted to a server.
                  */}
                  <p className="privacy-note-primary">
                    <span aria-hidden="true">🔒</span> Processed locally in your
                    browser — your information is not uploaded or stored on our
                    servers.
                  </p>
                  <p className="privacy-note-secondary">
                    For best practice, avoid entering unnecessary personal or
                    sensitive information.
                  </p>
                  <p className="privacy-note-secondary">
                    Generated files remain on your device unless you choose to
                    save or share them.
                  </p>
                </div>
              </section>

              <section className="card">
                <h2>Client Details</h2>
                <div className="form-row two">
                  <div>
                    <label htmlFor="clientName">Client name *</label>
                    <input
                      type="text"
                      id="clientName"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="clientBiz">Client business name *</label>
                    <input
                      type="text"
                      id="clientBiz"
                      placeholder="Smith & Co."
                    />
                  </div>
                </div>
                <div className="form-row two">
                  <div>
                    <label htmlFor="clientEmail">Client email</label>
                    <input
                      type="email"
                      id="clientEmail"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="clientAddress">Client address</label>
                    <textarea
                      id="clientAddress"
                      placeholder="Street, City, ZIP"
                    />
                  </div>
                </div>
                <p className="small-muted">
                  * Either client name or business name is required.
                </p>
              </section>

              <section className="card">
                <h2>Document Details</h2>
                <div className="form-row three">
                  <div>
                    <label htmlFor="docNumber">Document number</label>
                    <input type="text" id="docNumber" defaultValue="001" />
                  </div>
                  <div>
                    <label htmlFor="issueDate">Issue date</label>
                    <input type="date" id="issueDate" />
                  </div>
                  <div>
                    <label htmlFor="expiryDate">Valid until</label>
                    <input type="date" id="expiryDate" />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label htmlFor="projectTitle">Project / job title</label>
                    <input
                      type="text"
                      id="projectTitle"
                      placeholder="Kitchen renovation"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label htmlFor="notes">Notes / terms</label>
                    <textarea
                      id="notes"
                      placeholder="Payment due within 14 days of acceptance."
                    />
                  </div>
                </div>
              </section>

              <section className="card">
                <h2>Line Items</h2>
                <div className="items-mobile-wrap">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45%" }}>Description</th>
                        <th style={{ width: "15%" }}>Qty</th>
                        <th style={{ width: "20%" }}>Unit price</th>
                        <th style={{ width: "15%", textAlign: "right" }}>
                          Total
                        </th>
                        <th style={{ width: "5%" }} />
                      </tr>
                    </thead>
                    <tbody id="itemsBody" />
                  </table>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  id="addRowBtn"
                  style={{ marginTop: "0.5rem" }}
                >
                  + Add line item
                </button>

                <div className="totals">
                  <div>
                    <div className="form-row two">
                      <div>
                        <label htmlFor="discount">Discount</label>
                        <input
                          type="number"
                          id="discount"
                          min="0"
                          step="0.01"
                          defaultValue="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="discountType">Type</label>
                        <select id="discountType" defaultValue="amount">
                          <option value="amount">Fixed amount</option>
                          <option value="percent">Percent (%)</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row two">
                      <div>
                        <label htmlFor="taxRate">Tax / VAT (%)</label>
                        <input
                          type="number"
                          id="taxRate"
                          min="0"
                          step="0.01"
                          defaultValue="0"
                        />
                      </div>
                      <div>
                        <label htmlFor="currency">Currency symbol</label>
                        <input
                          type="text"
                          id="currency"
                          defaultValue="$"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="totals-summary" id="totalsSummary">
                    <div>
                      <span>Subtotal</span>
                      <span id="sumSubtotal">$0.00</span>
                    </div>
                    <div>
                      <span>Discount</span>
                      <span id="sumDiscount">-$0.00</span>
                    </div>
                    <div>
                      <span>Tax</span>
                      <span id="sumTax">$0.00</span>
                    </div>
                    <div className="grand">
                      <span>Grand total</span>
                      <span id="sumGrand">$0.00</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card actions-card">
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    id="downloadBtn"
                  >
                    ⬇ Download PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    id="resetBtn"
                  >
                    Reset form
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost preview-jump"
                    id="previewJump"
                  >
                    👁 View preview
                  </button>
                </div>
                <div
                  id="validationError"
                  className="error-msg"
                  style={{ display: "none" }}
                />
              </section>
            </div>

            {/* ============ PREVIEW COLUMN ============ */}
            <div className="preview-col">
              <section className="card">
                <h2>Live Preview</h2>
                <div className="preview-wrap">
                  <div className="preview-doc" id="preview" />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
