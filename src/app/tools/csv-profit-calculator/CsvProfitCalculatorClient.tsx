"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { CSV_CALCULATOR_FAQS } from "./faqContent";

const TOOLS_PAGES_HREF = "/pages/tools";

type MappingKey = "date" | "type" | "amount" | "fee" | "net" | "description";
type CostKey =
  | "packaging"
  | "shippingSupplies"
  | "ads"
  | "subscriptions"
  | "other";
type StatusType = "error" | "warning" | "success" | "info";
type SectionKey = "upload" | "process" | "summary";

type MappingField = {
  key: MappingKey;
  label: string;
  required: boolean;
  help: string;
  guesses: string[];
  reviewIfMissing?: boolean;
};

type SummaryRow = {
  month: string;
  revenue: number;
  fees: number;
  refunds: number;
  adjustments: number;
  netReceived: number;
};

type SummaryRowWithCosts = SummaryRow & {
  extraCosts: number;
  estimatedProfit: number;
};

type ExportColumn = {
  key: keyof SummaryRowWithCosts;
  label: string;
  width: number;
  type: "text" | "currency";
};

type FileEntry = {
  id: string;
  name: string;
  rows: string[][];
  headers: string[];
  guessedMappings: Record<MappingKey, string>;
  displaySymbol: string;
};

type CostBuckets = Record<CostKey, number>;

type State = {
  uploadedFiles: FileEntry[];
  combinedHeaders: string[];
  mappings: Record<MappingKey, string>;
  summaryRows: SummaryRow[];
  extraCosts: Record<string, CostBuckets>;
  displaySymbol: string;
  companyName: string;
  hasDownloadedFile: boolean;
};

type ParsedCurrencyValue = {
  valid: boolean;
  value: number | null;
};

type WorkbookCell = {
  type: "text" | "currency" | "profit";
  value: string | number;
};

type WorkbookRowKind =
  | "title"
  | "meta"
  | "spacer"
  | "header"
  | "data"
  | "dataAlt"
  | "total";

type WorkbookRow = {
  kind: WorkbookRowKind;
  height: number;
  cells: WorkbookCell[];
};

type PrimarySource = "amount" | "fee" | "net" | "none" | "derived";

const MAX_FILE_COUNT = 15;
const COMPANY_NAME_MAX_LENGTH = 100;

const EMPTY_MAPPINGS: Record<MappingKey, string> = {
  date: "",
  type: "",
  amount: "",
  fee: "",
  net: "",
  description: "",
};

const COST_FIELDS: Array<[CostKey, string]> = [
  ["packaging", "Packaging"],
  ["shippingSupplies", "Shipping Supplies"],
  ["ads", "Ads"],
  ["subscriptions", "Subscriptions"],
  ["other", "Other"],
];

const MAPPING_FIELDS: MappingField[] = [
  {
    key: "date",
    label: "Date column",
    required: true,
    help: 'When did the transaction happen? Usually labelled "Date" or "Transaction date".',
    guesses: [
      "date",
      "transaction date",
      "order date",
      "created date",
      "posted date",
    ],
  },
  {
    key: "type",
    label: "Transaction type column",
    required: true,
    help: 'What kind of transaction was it? Usually "Type" or "Transaction type" — this is how the tool tells sales from fees and refunds.',
    guesses: [
      "type",
      "transaction type",
      "activity type",
      "entry type",
      "kind",
    ],
  },
  {
    key: "amount",
    label: "Amount column",
    required: true,
    help: 'The monetary value of each row. Usually "Amount" or "Gross". Etsy placeholders like "--" are treated as 0.',
    guesses: [
      "amount",
      "gross",
      "total",
      "sale amount",
      "payment amount",
      "gross amount",
    ],
  },
  {
    key: "fee",
    label: "Fee column",
    required: false,
    help: 'Optional. A column that lists the Etsy fee charged per transaction. Etsy placeholders like "--" are treated as 0. Leave as "Not used" if your export does not have one.',
    guesses: [
      "fee",
      "fees",
      "fees & taxes",
      "fees and taxes",
      "etsy fee",
      "transaction fee",
      "fee amount",
    ],
  },
  {
    key: "net",
    label: "Net column",
    required: false,
    help: 'Optional. The amount received after fees. Etsy placeholders like "--" are treated as 0. Leave as "Not used" if your export does not include this.',
    guesses: ["net", "net amount", "amount net", "net total", "net received"],
  },
  {
    key: "description",
    label: "Description column",
    required: false,
    reviewIfMissing: true,
    help: "Optional. Any extra detail column such as notes or item title. Used to help classify ambiguous transactions.",
    guesses: ["description", "details", "memo", "notes", "title", "info"],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "month", label: "Month", width: 14, type: "text" },
  { key: "revenue", label: "Revenue", width: 16, type: "currency" },
  { key: "fees", label: "Etsy Fees", width: 16, type: "currency" },
  { key: "refunds", label: "Refunds", width: 16, type: "currency" },
  {
    key: "adjustments",
    label: "Adjustments",
    width: 16,
    type: "currency",
  },
  {
    key: "netReceived",
    label: "Net Received",
    width: 16,
    type: "currency",
  },
  {
    key: "extraCosts",
    label: "Extra Costs",
    width: 16,
    type: "currency",
  },
  {
    key: "estimatedProfit",
    label: "Estimated Profit",
    width: 18,
    type: "currency",
  },
];

const CRC32_TABLE = (() => {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table.push(crc >>> 0);
  }
  return table;
})();

function createEmptyCostBuckets(): CostBuckets {
  return {
    packaging: 0,
    shippingSupplies: 0,
    ads: 0,
    subscriptions: 0,
    other: 0,
  };
}

function createInitialState(): State {
  return {
    uploadedFiles: [],
    combinedHeaders: [],
    mappings: { ...EMPTY_MAPPINGS },
    summaryRows: [],
    extraCosts: {},
    displaySymbol: "",
    companyName: "",
    hasDownloadedFile: false,
  };
}

function setupCsvProfitCalculator(root: HTMLElement) {
  const state = createInitialState();
  const cleanupFns: Array<() => void> = [];
  const documentRef = root.ownerDocument;
  const windowRef = documentRef.defaultView;

  const query = <T extends Element>(selector: string) => {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`Missing required element: ${selector}`);
    }
    return element as T;
  };

  const on = (
    target: EventTarget | null | undefined,
    eventName: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) => {
    if (!target) return;
    target.addEventListener(eventName, handler, options);
    cleanupFns.push(() => {
      target.removeEventListener(eventName, handler, options);
    });
  };

  const uploadCard = query<HTMLElement>("#uploadCard");
  const uploadButton = query<HTMLButtonElement>("#uploadButton");
  const csvInput = query<HTMLInputElement>("#csvInput");
  const uploadShell = query<HTMLElement>("#uploadShell");
  const companyNameInput = query<HTMLInputElement>("#companyNameInput");
  const fileCount = query<HTMLElement>("#fileCount");
  const uploadedFilesWrap = query<HTMLElement>("#uploadedFilesWrap");
  const uploadedFilesList = query<HTMLUListElement>("#uploadedFilesList");
  const uploadSectionStatus = query<HTMLElement>("#uploadSectionStatus");

  const processCard = query<HTMLElement>("#processCard");
  const processSectionStatus = query<HTMLElement>("#processSectionStatus");
  const processButton = query<HTMLButtonElement>("#processButton");
  const processHelper = query<HTMLElement>("#processHelper");
  const cancelButton = query<HTMLButtonElement>("#cancelButton");

  const summarySection = query<HTMLElement>("#summarySection");
  const summarySectionStatus = query<HTMLElement>("#summarySectionStatus");
  const extraCostsPanel = query<HTMLElement>("#extraCostsPanel");
  const extraCostsToggle = query<HTMLElement>("#extraCostsToggle");
  const costTableBody = query<HTMLTableSectionElement>("#costTableBody");
  const summaryTableBody = query<HTMLTableSectionElement>("#summaryTableBody");
  const summaryTableFoot = query<HTMLTableSectionElement>("#summaryTableFoot");

  const downloadCsvButton = query<HTMLButtonElement>("#downloadCsvButton");
  const downloadXlsxButton = query<HTMLButtonElement>("#downloadXlsxButton");
  const downloadReadyMessage = query<HTMLElement>("#downloadReadyMessage");
  const submitAnotherButton = query<HTMLButtonElement>("#submitAnotherButton");

  const statusMessage = query<HTMLElement>("#statusMessage");

  let processErrorActive = false;

  const SECTION_STATUS_MAP: Record<SectionKey, HTMLElement> = {
    upload: uploadSectionStatus,
    process: processSectionStatus,
    summary: summarySectionStatus,
  };

  function setExtraCostsPanelOpen(isOpen: boolean) {
    extraCostsPanel.classList.toggle("is-open", isOpen);
    extraCostsToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function updateProcessActionVisibility() {
    processButton.classList.toggle("hidden", processErrorActive);
    cancelButton.classList.toggle("hidden", !processErrorActive);
  }

  function showMessage(text: string, type: StatusType) {
    statusMessage.textContent = text;
    statusMessage.dataset.type = type;
  }

  function setElementStatus(
    element: HTMLElement,
    text: string,
    type: StatusType | "",
  ) {
    if (!text) {
      element.textContent = "";
      delete element.dataset.type;
      return;
    }

    element.textContent = text;
    element.dataset.type = type;
  }

  function clearSectionStatus(sectionKey: SectionKey) {
    setElementStatus(SECTION_STATUS_MAP[sectionKey], "", "");
  }

  function announce(sectionKey: SectionKey, text: string, type: StatusType) {
    showMessage(text, type);
    setElementStatus(SECTION_STATUS_MAP[sectionKey], text, type);
  }

  function clearMessage() {
    statusMessage.textContent = "";
    delete statusMessage.dataset.type;
  }

  function setDownloadReadyMessage(text: string, type: StatusType | "") {
    setElementStatus(downloadReadyMessage, text, type);
  }

  function clearDownloadReadyMessage() {
    setDownloadReadyMessage("", "");
  }

  function sanitiseCompanyName(value: string) {
    return String(value || "")
      .slice(0, COMPANY_NAME_MAX_LENGTH)
      .trim();
  }

  function handleSuccessfulDownload() {
    state.hasDownloadedFile = true;
    submitAnotherButton.classList.remove("hidden");
    setDownloadReadyMessage(
      "Your report has been downloaded. Check your Downloads folder.",
      "success",
    );
  }

  function focusSection(element: HTMLElement) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetSummaryState() {
    state.summaryRows = [];
    state.extraCosts = {};
    state.hasDownloadedFile = false;
    summarySection.classList.add("hidden");
    setExtraCostsPanelOpen(false);
    clearSectionStatus("summary");
    clearDownloadReadyMessage();
    submitAnotherButton.classList.add("hidden");
  }

  function clearInMemoryCsvData() {
    state.uploadedFiles = [];
    state.combinedHeaders = [];
    state.summaryRows = [];
    state.extraCosts = {};
  }

  function recalculateStateFromUploadedFiles(
    options: { focus?: boolean } = {},
  ) {
    const { focus = true } = options;

    state.combinedHeaders = combineHeaders(state.uploadedFiles);
    state.displaySymbol =
      state.uploadedFiles.find((file) => file.displaySymbol)?.displaySymbol ??
      "";

    clearMessage();
    clearSectionStatus("upload");
    clearSectionStatus("process");
    resetSummaryState();

    if (!state.uploadedFiles.length) {
      state.mappings = { ...EMPTY_MAPPINGS };
      updateUploadedFilesDisplay();
      updateProcessButtonState();
      if (focus) focusSection(uploadCard);
      return;
    }

    state.mappings = buildCombinedMappings(
      state.mappings,
      state.combinedHeaders,
    );

    updateUploadedFilesDisplay();
    updateProcessButtonState();

    if (focus) focusSection(processCard);
  }

  function removeUploadedFile(fileId: string) {
    state.uploadedFiles = state.uploadedFiles.filter(
      (file) => file.id !== fileId,
    );
    recalculateStateFromUploadedFiles();
  }

  function formatMismatchMessage(mismatches: string[]) {
    const preview = mismatches.slice(0, 4).join(" ");
    const remaining = mismatches.length - 4;
    return remaining > 0
      ? `${preview} ${remaining} more mismatch${remaining === 1 ? "" : "es"} remaining.`
      : preview;
  }

  function buildUploadFormatErrorMessage(fileName: string, message: string) {
    return fileName ? `${fileName}: ${message}` : message;
  }

  async function handleFile(file: File) {
    if (state.uploadedFiles.length >= MAX_FILE_COUNT) {
      return {
        ok: false,
        message: `You can add up to ${MAX_FILE_COUNT} CSV files. Remove some or generate a report first.`,
      };
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return {
        ok: false,
        message: buildUploadFormatErrorMessage(
          file.name || "This file",
          "Please choose an Etsy CSV file (ending in .csv).",
        ),
      };
    }

    try {
      const text = await readCsvFile(file);
      const parsed = parseCsvText(text);

      if (!parsed.headers.length || !parsed.rows.length) {
        return {
          ok: false,
          message: buildUploadFormatErrorMessage(
            file.name,
            "We could not use this CSV because the format is not what we expected. Please check the file format and try again.",
          ),
        };
      }

      if (hasBlankHeaders(parsed.headers)) {
        return {
          ok: false,
          message: buildUploadFormatErrorMessage(
            file.name,
            "This CSV format is missing one or more column headers. Please check the file format and use a standard Etsy export.",
          ),
        };
      }

      if (isLikelyMissingHeaderRow(parsed.headers, parsed.rows)) {
        return {
          ok: false,
          message: buildUploadFormatErrorMessage(
            file.name,
            "This CSV format does not appear to include a header row. Please check the file format and use a standard Etsy export.",
          ),
        };
      }

      const fileEntry: FileEntry = {
        id: `${file.name}-${Date.now()}-${state.uploadedFiles.length}`,
        name: file.name,
        rows: parsed.rows,
        headers: parsed.headers,
        guessedMappings: guessMappings(parsed.headers),
        displaySymbol: detectDisplaySymbol(text),
      };

      state.uploadedFiles.push(fileEntry);
      state.combinedHeaders = combineHeaders(state.uploadedFiles);
      resetSummaryState();

      state.displaySymbol = state.displaySymbol || fileEntry.displaySymbol;
      state.mappings = buildCombinedMappings(
        state.mappings,
        state.combinedHeaders,
      );

      updateUploadedFilesDisplay();
      updateProcessButtonState();

      focusSection(processCard);
      return { ok: true, message: "" };
    } catch {
      return {
        ok: false,
        message: buildUploadFormatErrorMessage(
          file.name,
          "We could not use this CSV because the format is not what we expected. Please check the file format and try again with a standard Etsy export.",
        ),
      };
    }
  }

  async function handleSelectedFiles(fileList: FileList | readonly File[]) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const availableSlots = Math.max(
      MAX_FILE_COUNT - state.uploadedFiles.length,
      0,
    );
    const uploadMessages: string[] = [];
    let hasUploadErrors = false;
    let filesSkippedByLimit = 0;

    if (!availableSlots) {
      announce(
        "upload",
        `You already have ${MAX_FILE_COUNT} CSVs selected. Remove some before adding more.`,
        "warning",
      );
      return;
    }

    clearMessage();
    clearSectionStatus("upload");

    for (let index = 0; index < files.length; index += 1) {
      if (state.uploadedFiles.length >= MAX_FILE_COUNT) {
        filesSkippedByLimit = files.length - index;
        break;
      }

      const result = await handleFile(files[index]);
      if (!result.ok && result.message) {
        uploadMessages.push(result.message);
        hasUploadErrors = true;
      }
    }

    if (filesSkippedByLimit > 0) {
      uploadMessages.push(
        `Only ${availableSlots} file${availableSlots === 1 ? " was" : "s were"} added. The ${MAX_FILE_COUNT}-file limit was reached and ${filesSkippedByLimit} file${filesSkippedByLimit === 1 ? " was" : "s were"} skipped.`,
      );
    }

    if (uploadMessages.length) {
      announce(
        "upload",
        uploadMessages.join(" "),
        hasUploadErrors ? "error" : "warning",
      );
      if (!state.uploadedFiles.length) focusSection(uploadCard);
    }
  }

  function updateUploadedFilesDisplay() {
    fileCount.textContent = `${state.uploadedFiles.length} of ${MAX_FILE_COUNT} CSVs`;

    uploadedFilesList.innerHTML = "";
    state.uploadedFiles.forEach((file, index) => {
      const item = documentRef.createElement("li");
      const name = documentRef.createElement("span");
      name.className = "upload-list-name";
      name.textContent = `${index + 1}. ${file.name}`;

      const removeButton = documentRef.createElement("button");
      removeButton.type = "button";
      removeButton.className = "upload-remove-button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Remove ${file.name}`);
      removeButton.title = `Remove ${file.name}`;
      removeButton.addEventListener("click", () => removeUploadedFile(file.id));

      item.append(name, removeButton);
      uploadedFilesList.appendChild(item);
    });

    uploadedFilesWrap.classList.toggle(
      "hidden",
      state.uploadedFiles.length === 0,
    );
    uploadButton.disabled = state.uploadedFiles.length >= MAX_FILE_COUNT;
  }

  function updateProcessButtonState(options: { focusOnError?: boolean } = {}) {
    const { focusOnError = false } = options;
    const hasFiles = state.uploadedFiles.length > 0;
    const hasSummary = state.summaryRows.length > 0;

    processErrorActive = false;
    updateProcessActionVisibility();

    if (!hasFiles) {
      processCard.classList.add("hidden");
      clearSectionStatus("process");
      processButton.disabled = true;
      processHelper.textContent = "Choose at least one CSV to continue.";
      return { ok: false, type: "empty" as const };
    }

    processCard.classList.toggle("hidden", hasSummary);

    if (hasSummary) {
      clearSectionStatus("process");
      processButton.disabled = false;
      processHelper.textContent =
        "We'll automatically use the standard Etsy columns from your CSV.";
      return { ok: true, type: "summary" as const };
    }

    const validation = getDetectedColumnValidationResult(state.mappings);

    if (!validation.ok) {
      announce("process", validation.message, "error");
      processButton.disabled = true;
      processHelper.textContent =
        "We could not automatically match Date, Transaction type, and Amount for every file. Use a standard Etsy export or remove the affected file.";
      if (focusOnError) focusSection(processCard);
      return validation;
    }

    setElementStatus(processSectionStatus, validation.message, "success");
    processButton.disabled = false;
    processHelper.textContent =
      "We'll automatically use the standard Etsy columns from your CSV.";
    return validation;
  }

  function readCsvFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsText(file);
    });
  }

  function parseCsvText(text: string) {
    const delimiter = detectDelimiter(text);
    const rows: string[][] = [];
    let currentCell = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const nextCharacter = text[index + 1];

      if (character === '"') {
        if (inQuotes && nextCharacter === '"') {
          currentCell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && character === delimiter) {
        currentRow.push(currentCell);
        currentCell = "";
        continue;
      }

      if (!inQuotes && (character === "\n" || character === "\r")) {
        if (character === "\r" && nextCharacter === "\n") {
          index += 1;
        }
        currentRow.push(currentCell);
        currentCell = "";
        rows.push(currentRow);
        currentRow = [];
        continue;
      }

      currentCell += character;
    }

    if (currentCell.length || currentRow.length) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    const cleanedRows = rows
      .map((row) =>
        row.map((cell) =>
          String(cell || "")
            .replace(/^\uFEFF/, "")
            .trim(),
        ),
      )
      .filter((row) => row.some((cell) => cell !== ""));

    if (!cleanedRows.length) {
      return { headers: [] as string[], rows: [] as string[][] };
    }

    const headers = cleanedRows[0];
    const dataRows = cleanedRows.slice(1).map((row) => {
      if (row.length < headers.length) {
        return [...row, ...new Array(headers.length - row.length).fill("")];
      }
      return row.slice(0, headers.length);
    });

    return { headers, rows: dataRows };
  }

  function detectDelimiter(text: string) {
    const sample = text.split(/\r?\n/).find((line) => line.trim().length) || "";
    const candidates = [",", ";", "\t", "|"];
    let best = ",";
    let bestScore = -1;

    candidates.forEach((candidate) => {
      const score = sample.split(candidate).length - 1;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    });

    return best;
  }

  function guessMappings(headers: string[]) {
    const result = { ...EMPTY_MAPPINGS };
    MAPPING_FIELDS.forEach((field) => {
      result[field.key] = guessHeader(headers, field.guesses);
    });
    return result;
  }

  function combineHeaders(files: FileEntry[]) {
    const unique: string[] = [];
    const seen = new Set<string>();

    files.forEach((file) => {
      file.headers.forEach((header) => {
        const normalised = normaliseHeader(header);
        if (!seen.has(normalised)) {
          seen.add(normalised);
          unique.push(header);
        }
      });
    });

    return unique;
  }

  function buildCombinedMappings(
    currentMappings: Record<MappingKey, string>,
    headers: string[],
  ) {
    const guessed = guessMappings(headers);
    const next = { ...EMPTY_MAPPINGS };

    MAPPING_FIELDS.forEach((field) => {
      const current = currentMappings[field.key];
      next[field.key] =
        findEquivalentHeader(headers, current) || guessed[field.key];
    });

    return next;
  }

  function getDetectedColumnValidationResult(
    mappings: Record<MappingKey, string>,
  ) {
    if (!state.uploadedFiles.length) {
      return { ok: false, type: "empty" as const, message: "" };
    }

    const missingByFile: string[] = [];

    state.uploadedFiles.forEach((file) => {
      const resolved = resolveMappingsForFile(file, mappings);
      const missingRequired = MAPPING_FIELDS.filter(
        (field) => field.required && !resolved[field.key],
      ).map((field) => field.label.replace(" column", ""));

      if (missingRequired.length) {
        missingByFile.push(`${file.name}: ${missingRequired.join(", ")}`);
      }
    });

    if (missingByFile.length) {
      return {
        ok: false,
        type: "required" as const,
        message: `We could not automatically match Date, Transaction type, and Amount for every file. ${formatMismatchMessage(missingByFile)} Use a standard Etsy export or remove the affected file.`,
      };
    }

    return {
      ok: true,
      type: "ok" as const,
      message:
        "We matched the standard Etsy columns automatically. Generate your report whenever you're ready.",
    };
  }

  function resolveMappingsForFile(
    file: FileEntry,
    mappings: Record<MappingKey, string>,
  ) {
    const resolved = { ...EMPTY_MAPPINGS };
    MAPPING_FIELDS.forEach((field) => {
      const selected = mappings[field.key];
      const matchedHeader = findEquivalentHeader(file.headers, selected);
      resolved[field.key] = matchedHeader
        ? matchedHeader
        : file.guessedMappings[field.key] || "";
    });
    return resolved;
  }

  function guessHeader(headers: string[], guesses: string[]) {
    let bestMatch = "";
    let bestScore = 0;

    headers.forEach((header) => {
      const normalised = normaliseHeader(header);
      guesses.forEach((guess) => {
        let score = 0;
        if (normalised === guess) score = 100;
        else if (normalised.startsWith(guess) || normalised.endsWith(guess))
          score = 80;
        else if (normalised.includes(guess)) score = 70;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      });
    });

    return bestMatch;
  }

  function normaliseHeader(value: string) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasBlankHeaders(headers: string[]) {
    return headers.some((header) => !String(header || "").trim());
  }

  function hasRecognisableHeaderLabels(headers: string[]) {
    return MAPPING_FIELDS.filter((field) => field.required).some((field) =>
      Boolean(guessHeader(headers, field.guesses)),
    );
  }

  function isLikelyMissingHeaderRow(headers: string[], rows: string[][]) {
    if (hasRecognisableHeaderLabels(headers)) return false;

    if (countDataLikeCells(headers) >= 2) return true;

    const sampleRows = rows
      .filter((row) => row.some((cell) => String(cell || "").trim()))
      .slice(0, 3);
    return sampleRows.some(
      (row) => countNonTextShapeMatches(headers, row) >= 2,
    );
  }

  function countDataLikeCells(row: string[]) {
    return row.reduce((count, cell) => {
      const kind = inferCellKind(cell);
      return kind === "date" || kind === "number" || kind === "transaction"
        ? count + 1
        : count;
    }, 0);
  }

  function countNonTextShapeMatches(firstRow: string[], secondRow: string[]) {
    const length = Math.min(firstRow.length, secondRow.length);
    let matches = 0;

    for (let index = 0; index < length; index += 1) {
      const firstKind = inferCellKind(firstRow[index]);
      const secondKind = inferCellKind(secondRow[index]);
      if (
        firstKind === secondKind &&
        firstKind !== "text" &&
        firstKind !== "empty"
      ) {
        matches += 1;
      }
    }

    return matches;
  }

  function inferCellKind(value: string) {
    const text = String(value || "").trim();
    if (!text) return "empty";
    if (detectDateValue(text)) return "date";

    const amount = parseCurrencyValue(text);
    if (amount.valid && amount.value !== null) return "number";

    if (
      [
        "sale",
        "payment",
        "order",
        "fee",
        "refund",
        "adjustment",
        "deposit",
        "payout",
        "transfer",
        "disbursement",
        "reserve",
        "chargeback",
      ].includes(normaliseHeader(text))
    ) {
      return "transaction";
    }

    return "text";
  }

  function findEquivalentHeader(headers: string[], selectedHeader: string) {
    if (!selectedHeader) return "";

    const target = normaliseHeader(selectedHeader);
    return headers.find((header) => normaliseHeader(header) === target) || "";
  }

  function buildCombinedMonthlySummary(
    files: FileEntry[],
    mappings: Record<MappingKey, string>,
  ) {
    const months = new Map<string, SummaryRow>();
    const skipped: string[] = [];

    for (const file of files) {
      const resolved = resolveMappingsForFile(file, mappings);
      const missing = MAPPING_FIELDS.filter(
        (field) => field.required && !resolved[field.key],
      );

      if (missing.length) {
        return {
          ok: false,
          message: `We could not use "${file.name}" because the format is not what we expected. Please check the column format and matches.`,
        };
      }

      const result = buildMonthlySummary(file.rows, file.headers, resolved);

      if (!result.ok) {
        return { ok: false, message: `${file.name}: ${result.message}` };
      }

      if (result.skippedBecauseIgnoredOnly) {
        skipped.push(file.name);
        continue;
      }

      (result.summaryRows ?? []).forEach((row) => {
        const bucket = months.get(row.month) || createMonthBucket(row.month);
        months.set(row.month, mergeMonthlyBuckets(bucket, row));
      });
    }

    const summaryRows = Array.from(months.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    if (!summaryRows.length) {
      return {
        ok: false,
        message:
          "These files only contained deposits, payouts, or other rows that are excluded from the monthly totals.",
      };
    }

    return { ok: true, summaryRows, skippedFiles: skipped };
  }

  function buildMonthlySummary(
    rows: string[][],
    headers: string[],
    mappings: Record<MappingKey, string>,
  ) {
    const indexes = {
      date: headers.indexOf(mappings.date),
      type: headers.indexOf(mappings.type),
      amount: headers.indexOf(mappings.amount),
      fee: mappings.fee ? headers.indexOf(mappings.fee) : -1,
      net: mappings.net ? headers.indexOf(mappings.net) : -1,
      description: mappings.description
        ? headers.indexOf(mappings.description)
        : -1,
    };

    if (indexes.date < 0 || indexes.type < 0 || indexes.amount < 0) {
      return {
        ok: false,
        message:
          "We could not use this CSV because the required columns were not in the expected format. Please check the file format for Date, Transaction type, and Amount.",
      };
    }

    const months = new Map<string, SummaryRow>();
    let validRows = 0;
    let invalidDateCount = 0;
    let invalidAmountCount = 0;

    rows.forEach((row) => {
      if (!row.some((cell) => String(cell || "").trim())) return;

      const monthKey = detectMonthKey(row[indexes.date]);
      if (!monthKey) {
        invalidDateCount += 1;
        return;
      }

      const amountValue = parseCurrencyValue(row[indexes.amount]);
      const feeValue =
        indexes.fee >= 0
          ? parseCurrencyValue(row[indexes.fee])
          : { valid: true, value: null as number | null };
      const netValue =
        indexes.net >= 0
          ? parseCurrencyValue(row[indexes.net])
          : { valid: true, value: null as number | null };

      if (!amountValue.valid || !feeValue.valid || !netValue.valid) {
        invalidAmountCount += 1;
        return;
      }

      let primary = selectPrimaryValue(
        amountValue.value,
        feeValue.value,
        netValue.value,
      );

      if (primary.value === null) {
        const descriptionText =
          indexes.description >= 0 ? row[indexes.description] : "";
        const fallback = extractTransferAmount(
          row[indexes.type],
          descriptionText,
        );
        if (fallback !== null) {
          primary = { source: "derived" as const, value: fallback };
        }
      }

      if (primary.value === null) return;

      const typeText = String(row[indexes.type] || "")
        .trim()
        .toLowerCase();
      const descriptionText =
        indexes.description >= 0
          ? String(row[indexes.description] || "")
              .trim()
              .toLowerCase()
          : "";
      const category = classifyTransaction(
        typeText,
        descriptionText,
        primary.value,
      );

      const bucket = months.get(monthKey) || createMonthBucket(monthKey);
      const fee = feeValue.value ?? 0;
      const net = netValue.value;

      if (category === "revenue") bucket.revenue += Math.max(primary.value, 0);
      else if (category === "refund") bucket.refunds += primary.value;
      else if (category === "fee") bucket.fees += primary.value;
      else bucket.adjustments += primary.value;

      if (primary.source === "amount" && fee) {
        bucket.fees += fee;
      }

      bucket.netReceived += calculateNetContribution(
        primary.source,
        primary.value,
        feeValue.value,
        net,
      );

      validRows += 1;
      months.set(monthKey, bucket);
    });

    if (!validRows && invalidDateCount) {
      return {
        ok: false,
        message:
          "We could not use this CSV because the date format is not what we expected. Please check the file format and the selected date column.",
      };
    }

    if (invalidAmountCount > 0) {
      return {
        ok: false,
        message:
          "We could not use this CSV because some money values are not in the expected format. Please check the format of the Amount, Fees, and Net columns.",
      };
    }

    if (!validRows) {
      return {
        ok: true,
        summaryRows: [] as SummaryRow[],
        skippedBecauseIgnoredOnly: true,
      };
    }

    const summaryRows = Array.from(months.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    return { ok: true, summaryRows, skippedBecauseIgnoredOnly: false };
  }

  function createMonthBucket(month: string): SummaryRow {
    return {
      month,
      revenue: 0,
      fees: 0,
      refunds: 0,
      adjustments: 0,
      netReceived: 0,
    };
  }

  function mergeMonthlyBuckets(existing: SummaryRow, next: SummaryRow) {
    existing.revenue += next.revenue;
    existing.fees += next.fees;
    existing.refunds += next.refunds;
    existing.adjustments += next.adjustments;
    existing.netReceived += next.netReceived;
    return existing;
  }

  function selectPrimaryValue(
    amountValue: number | null,
    feeValue: number | null,
    netValue: number | null,
  ): { source: PrimarySource; value: number | null } {
    if (amountValue !== null)
      return { source: "amount" as const, value: amountValue };
    if (feeValue !== null) return { source: "fee" as const, value: feeValue };
    if (netValue !== null) return { source: "net" as const, value: netValue };
    return { source: "none" as const, value: null };
  }

  function calculateNetContribution(
    primarySource: PrimarySource,
    primaryValue: number,
    feeValue: number | null,
    netValue: number | null,
  ) {
    if (netValue !== null) return netValue;
    if (primarySource === "amount") return primaryValue + (feeValue ?? 0);
    return primaryValue ?? 0;
  }

  function classifyTransaction(
    type: string,
    description: string,
    amount: number,
  ) {
    const combined = `${type} ${description}`.trim();

    if (containsAny(type, ["deposit", "disbursement", "payout", "transfer"])) {
      return "adjustment" as const;
    }
    if (containsAny(type, ["refund", "reversal", "chargeback"])) {
      return "refund" as const;
    }
    if (containsAny(type, ["sale", "payment", "order"])) {
      return amount < 0 ? ("refund" as const) : ("revenue" as const);
    }
    if (containsAny(type, ["fee", "vat", "tax", "marketing"])) {
      return "fee" as const;
    }
    if (containsAny(type, ["adjustment", "reserve"])) {
      return "adjustment" as const;
    }

    if (
      containsAny(combined, [
        "refund",
        "reversal",
        "chargeback",
        "cancel",
        "cancelled",
        "returned",
      ])
    ) {
      return "refund" as const;
    }
    if (
      containsAny(combined, [
        "fee",
        "listing",
        "regulatory",
        "processing",
        "offsite ads",
        "shipping label",
        "marketing",
      ])
    ) {
      return "fee" as const;
    }
    if (
      containsAny(combined, [
        "adjustment",
        "reserve",
        "disbursement",
        "deposit",
        "transfer",
        "tax",
        "vat",
        "balance",
        "payout",
      ])
    ) {
      return "adjustment" as const;
    }
    if (
      containsAny(combined, [
        "sale",
        "order",
        "payment",
        "credit",
        "shipping",
        "receipt",
      ])
    ) {
      return amount < 0 ? ("refund" as const) : ("revenue" as const);
    }

    return amount < 0 ? ("adjustment" as const) : ("revenue" as const);
  }

  function containsAny(text: string, words: string[]) {
    return words.some((word) => text.includes(word));
  }

  function extractTransferAmount(typeText: string, descriptionText: string) {
    const type = String(typeText || "")
      .trim()
      .toLowerCase();
    if (!containsAny(type, ["deposit", "disbursement", "payout", "transfer"])) {
      return null;
    }

    const match = String(descriptionText || "").match(/[£$€]\s*\d[\d,.]*/);
    if (!match) return null;

    const parsed = parseCurrencyValue(match[0]);
    return parsed.valid ? parsed.value : null;
  }

  function detectMonthKey(value: string) {
    const date = detectDateValue(value);
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function detectDateValue(value: string) {
    const text = String(value || "").trim();
    if (!text) return null;

    let match = text.match(/^(\d{1,2})\s+([a-zA-Z]+),?\s+(\d{4})/);
    if (match) {
      const month = getMonthNumberFromName(match[2]);
      if (month) {
        return safeDate(Number(match[3]), month, Number(match[1]));
      }
    }

    match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      return safeDate(Number(match[1]), Number(match[2]), Number(match[3]));
    }

    match = text.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})/);
    if (match) {
      return safeDate(Number(match[1]), Number(match[2]), Number(match[3]));
    }

    match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
    if (match) {
      const first = Number(match[1]);
      const second = Number(match[2]);
      const year = normaliseYear(match[3]);
      return first > 12 && second <= 12
        ? safeDate(year, second, first)
        : safeDate(year, first, second);
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function normaliseYear(value: string) {
    const number = Number(value);
    return value.length === 2
      ? number >= 70
        ? 1900 + number
        : 2000 + number
      : number;
  }

  function getMonthNumberFromName(value: string) {
    const map: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    return (
      map[
        String(value || "")
          .trim()
          .toLowerCase()
      ] || 0
    );
  }

  function safeDate(year: number, month: number, day: number) {
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function parseCurrencyValue(value: string): ParsedCurrencyValue {
    const text = String(value || "").trim();
    if (!text) return { valid: true, value: null };
    if (/^(?:[-–—]+|n\/a)$/i.test(text)) return { valid: true, value: 0 };

    let cleaned = text.replace(/\u00A0/g, "").replace(/\s+/g, "");
    let negative = false;

    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
      negative = true;
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.endsWith("-")) {
      negative = true;
      cleaned = cleaned.slice(0, -1);
    }
    if (cleaned.startsWith("-")) {
      negative = true;
      cleaned = cleaned.slice(1);
    }

    cleaned = cleaned.replace(/[£$€]/g, "");

    const commaCount = (cleaned.match(/,/g) || []).length;
    const dotCount = (cleaned.match(/\./g) || []).length;

    if (commaCount && dotCount) {
      cleaned =
        cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
          ? cleaned.replace(/\./g, "").replace(/,/g, ".")
          : cleaned.replace(/,/g, "");
    } else if (commaCount && !dotCount) {
      const lastComma = cleaned.lastIndexOf(",");
      const decimals = cleaned.length - lastComma - 1;
      cleaned =
        decimals <= 2 ? cleaned.replace(/,/g, ".") : cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }

    if (!/^\d*\.?\d+$/.test(cleaned)) return { valid: false, value: null };

    const parsed = Number(cleaned);
    if (Number.isNaN(parsed)) return { valid: false, value: null };
    return { valid: true, value: negative ? -parsed : parsed };
  }

  function detectDisplaySymbol(text: string) {
    const matches = text.match(/[£$€]/g) || [];
    if (!matches.length) return "";

    const counts: Record<string, number> = matches.reduce<
      Record<string, number>
    >((accumulator, symbol) => {
      accumulator[symbol] = (accumulator[symbol] || 0) + 1;
      return accumulator;
    }, {});

    return (
      Object.entries(counts).sort(
        (left, right) => right[1] - left[1],
      )[0]?.[0] || ""
    );
  }

  function ensureExtraCostBuckets() {
    const valid = new Set(state.summaryRows.map((row) => row.month));

    Object.keys(state.extraCosts).forEach((month) => {
      if (!valid.has(month)) {
        delete state.extraCosts[month];
      }
    });

    state.summaryRows.forEach((row) => {
      if (!state.extraCosts[row.month]) {
        state.extraCosts[row.month] = createEmptyCostBuckets();
      }
    });
  }

  function renderCostTable() {
    costTableBody.innerHTML = "";

    state.summaryRows.forEach((row) => {
      const tableRow = documentRef.createElement("tr");

      const monthCell = documentRef.createElement("td");
      monthCell.className = "month-cell";
      monthCell.textContent = row.month;
      tableRow.appendChild(monthCell);

      COST_FIELDS.forEach(([key, label]) => {
        const tableCell = documentRef.createElement("td");
        const input = documentRef.createElement("input");
        input.type = "number";
        input.min = "0";
        input.step = "0.01";
        input.value = String(state.extraCosts[row.month][key] || 0);
        input.dataset.month = row.month;
        input.dataset.costKey = key;
        input.setAttribute("aria-label", `${row.month} ${label}`);
        input.addEventListener("input", handleCostInput);
        tableCell.appendChild(input);
        tableRow.appendChild(tableCell);
      });

      costTableBody.appendChild(tableRow);
    });
  }

  function handleCostInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const month = input.dataset.month;
    const costKey = input.dataset.costKey as CostKey | undefined;

    if (!month || !costKey) return;

    const value = Number(input.value || 0);
    state.extraCosts[month][costKey] = Number.isFinite(value) ? value : 0;
    renderSummaryTable();
  }

  function appendSummaryCell(
    rowElement: HTMLTableRowElement,
    text: string,
    className = "",
  ) {
    const cell = documentRef.createElement("td");
    if (className) {
      cell.className = className;
    }
    cell.textContent = text;
    rowElement.appendChild(cell);
  }

  function appendSummaryRow(
    container: HTMLTableSectionElement,
    row: SummaryRowWithCosts,
  ) {
    const tableRow = documentRef.createElement("tr");
    appendSummaryCell(tableRow, row.month, "month-cell");
    appendSummaryCell(tableRow, formatCurrency(row.revenue));
    appendSummaryCell(tableRow, formatCurrency(row.fees));
    appendSummaryCell(tableRow, formatCurrency(row.refunds));
    appendSummaryCell(tableRow, formatCurrency(row.adjustments));
    appendSummaryCell(tableRow, formatCurrency(row.netReceived));
    appendSummaryCell(tableRow, formatCurrency(row.extraCosts));
    appendSummaryCell(
      tableRow,
      formatCurrency(row.estimatedProfit),
      "profit-cell",
    );
    container.appendChild(tableRow);
  }

  function renderSummaryTable() {
    summaryTableBody.replaceChildren();
    summaryTableFoot.replaceChildren();

    const rows = getSummaryWithCosts();
    rows.forEach((row) => appendSummaryRow(summaryTableBody, row));

    if (!rows.length) return;

    const totals = calculateSummaryTotals(rows);
    appendSummaryRow(summaryTableFoot, totals);
  }

  function getSummaryWithCosts() {
    return state.summaryRows.map((row) => {
      const extra = sumValues(
        state.extraCosts[row.month] || createEmptyCostBuckets(),
      );
      return {
        ...row,
        extraCosts: extra,
        estimatedProfit: row.netReceived - extra,
      };
    });
  }

  function getExportRows() {
    const rows = getSummaryWithCosts();
    return rows.length ? [...rows, calculateSummaryTotals(rows)] : [];
  }

  function calculateSummaryTotals(rows: SummaryRowWithCosts[]) {
    return rows.reduce<SummaryRowWithCosts>(
      (totals, row) => {
        totals.revenue += Number(row.revenue || 0);
        totals.fees += Number(row.fees || 0);
        totals.refunds += Number(row.refunds || 0);
        totals.adjustments += Number(row.adjustments || 0);
        totals.netReceived += Number(row.netReceived || 0);
        totals.extraCosts += Number(row.extraCosts || 0);
        totals.estimatedProfit += Number(row.estimatedProfit || 0);
        return totals;
      },
      {
        month: "Total",
        revenue: 0,
        fees: 0,
        refunds: 0,
        adjustments: 0,
        netReceived: 0,
        extraCosts: 0,
        estimatedProfit: 0,
      },
    );
  }

  function formatCurrency(value: number) {
    const number = Number(value || 0);
    const fixed = Math.abs(number).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${number < 0 ? "-" : ""}${state.displaySymbol}${fixed}`;
  }

  function sumValues(obj: CostBuckets) {
    return Object.values(obj).reduce(
      (total, current) => total + Number(current || 0),
      0,
    );
  }

  function convertSummaryToCsv(rows: SummaryRowWithCosts[]) {
    const headers = EXPORT_COLUMNS.map((column) => column.label);
    const lines = [headers.join(",")];

    rows.forEach((row) => {
      lines.push(
        EXPORT_COLUMNS.map((column) => {
          const rawValue = row[column.key];
          return column.type === "currency"
            ? Number(rawValue || 0).toFixed(2)
            : String(rawValue || "");
        })
          .map(escapeCsvValue)
          .join(","),
      );
    });

    return lines.join("\r\n");
  }

  function buildWorkbookDisplayRows(rows: SummaryRowWithCosts[]) {
    const bodyRows = rows.filter((row) => row.month !== "Total");
    const totalRow = rows.find((row) => row.month === "Total") || null;
    const title = state.companyName
      ? `${state.companyName} • Etsy Monthly Accounts Summary`
      : "Etsy Monthly Accounts Summary";
    const metaLabel = `Prepared ${new Date().toISOString().slice(0, 10)} • ${state.uploadedFiles.length || 1} file${state.uploadedFiles.length === 1 ? "" : "s"}`;

    const emptyCells = () =>
      EXPORT_COLUMNS.map<WorkbookCell>(() => ({ type: "text", value: "" }));
    const toCells = (row: SummaryRowWithCosts) =>
      EXPORT_COLUMNS.map<WorkbookCell>((column) => {
        const rawValue = row[column.key];
        return {
          type: column.key === "estimatedProfit" ? "profit" : column.type,
          value:
            column.type === "currency"
              ? Number(rawValue || 0)
              : String(rawValue || ""),
        };
      });

    const displayRows: WorkbookRow[] = [];

    const titleCells = emptyCells();
    titleCells[0] = { type: "text", value: title };
    displayRows.push({ kind: "title", height: 28, cells: titleCells });

    const metaCells = emptyCells();
    metaCells[0] = { type: "text", value: metaLabel };
    displayRows.push({ kind: "meta", height: 20, cells: metaCells });

    displayRows.push({ kind: "spacer", height: 10, cells: emptyCells() });
    displayRows.push({
      kind: "header",
      height: 22,
      cells: EXPORT_COLUMNS.map((column) => ({
        type: "text",
        value: column.label,
      })),
    });

    bodyRows.forEach((row, index) => {
      displayRows.push({
        kind: index % 2 === 0 ? "data" : "dataAlt",
        height: 20,
        cells: toCells(row),
      });
    });

    if (totalRow) {
      displayRows.push({ kind: "spacer", height: 10, cells: emptyCells() });
      displayRows.push({ kind: "total", height: 22, cells: toCells(totalRow) });
    }

    return {
      displayRows,
      headerRowNumber: 4,
      firstDataRowNumber: 5,
      dataRowCount: bodyRows.length,
      lastColumnName: columnNumberToName(EXPORT_COLUMNS.length),
      usedRangeEndRow: displayRows.length,
    };
  }

  function getXlsxStyleId(
    rowKind: WorkbookRowKind,
    cellType: "text" | "currency" | "profit",
  ) {
    if (rowKind === "title") return 3;
    if (rowKind === "meta") return 4;
    if (rowKind === "spacer") return 9;
    if (rowKind === "header") return 2;
    if (rowKind === "total")
      return cellType === "currency" || cellType === "profit" ? 8 : 7;
    if (rowKind === "dataAlt")
      return cellType === "profit" ? 11 : cellType === "currency" ? 6 : 5;
    return cellType === "profit" ? 10 : cellType === "currency" ? 1 : 0;
  }

  function createXlsxWorkbook(rows: SummaryRowWithCosts[]) {
    return createZipBlob([
      { name: "[Content_Types].xml", content: createXlsxContentTypesXml() },
      { name: "_rels/.rels", content: createXlsxRootRelsXml() },
      { name: "docProps/app.xml", content: createXlsxAppXml() },
      { name: "docProps/core.xml", content: createXlsxCoreXml() },
      { name: "xl/workbook.xml", content: createXlsxWorkbookXml() },
      {
        name: "xl/_rels/workbook.xml.rels",
        content: createXlsxWorkbookRelsXml(),
      },
      { name: "xl/styles.xml", content: createXlsxStylesXml() },
      { name: "xl/worksheets/sheet1.xml", content: createXlsxSheetXml(rows) },
    ]);
  }

  function createXlsxContentTypesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
  }

  function createXlsxRootRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  }

  function createXlsxAppXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>SimpleBizToolkit.com</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr"><vt:lpstr>Monthly Accounts</vt:lpstr></vt:vector>
  </TitlesOfParts>
</Properties>`;
  }

  function createXlsxCoreXml() {
    const timestamp = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>SimpleBizToolkit.com</dc:creator>
  <cp:lastModifiedBy>SimpleBizToolkit.com</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>
  <dc:title>Etsy CSV Monthly Accounts Cleaner</dc:title>
</cp:coreProperties>`;
  }

  function createXlsxWorkbookXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>
  <sheets><sheet name="Monthly Accounts" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
  }

  function createXlsxWorkbookRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  }

  function createXlsxStylesXml() {
    const formatCode = xmlEscape(
      `${state.displaySymbol || ""}#,##0.00;[Red](${state.displaySymbol || ""}#,##0.00)`,
    );

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="${formatCode}"/></numFmts>
  <fonts count="5">
    <font><sz val="11"/><color rgb="FF2B2A28"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="15"/><color rgb="FF1A4B3E"/><name val="Calibri"/><family val="2"/></font>
    <font><i/><sz val="10"/><color rgb="FF6D665E"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FF0D5C3F"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF414556"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8F9FB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F2EF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F3F6"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E5EA"/></left><right style="thin"><color rgb="FFE2E5EA"/></right>
      <top style="thin"><color rgb="FFE2E5EA"/></top><bottom style="thin"><color rgb="FFE2E5EA"/></bottom><diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFC8D8D0"/></left><right style="thin"><color rgb="FFC8D8D0"/></right>
      <top style="medium"><color rgb="FF1A7F5A"/></top><bottom style="thin"><color rgb="FFC8D8D0"/></bottom><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  }

  function createXlsxSheetXml(rows: SummaryRowWithCosts[]) {
    const layout = buildWorkbookDisplayRows(rows);

    const sheetRows = layout.displayRows.map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row.cells
        .map((cell, columnIndex) => {
          const reference = `${columnNumberToName(columnIndex + 1)}${rowNumber}`;
          const styleId = getXlsxStyleId(row.kind, cell.type);
          if (cell.type === "currency" || cell.type === "profit") {
            return `<c r="${reference}" s="${styleId}"><v>${Number(cell.value || 0).toFixed(2)}</v></c>`;
          }
          return `<c r="${reference}" t="inlineStr" s="${styleId}"><is><t>${xmlEscape(cell.value || "")}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowNumber}" ht="${row.height}" customHeight="1">${cells}</row>`;
    });

    const columnDefinitions = EXPORT_COLUMNS.map(
      (column, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${column.width + 1.5}" customWidth="1"/>`,
    ).join("");

    const lastCell = `${layout.lastColumnName}${Math.max(layout.usedRangeEndRow, 1)}`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="${layout.headerRowNumber}" topLeftCell="A${layout.firstDataRowNumber}" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${columnDefinitions}</cols>
  <sheetData>${sheetRows.join("")}</sheetData>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
  }

  function createZipBlob(files: Array<{ name: string; content: string }>) {
    const encoder = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = encoder.encode(file.content);
      const crc = crc32(dataBytes);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, 0, true);
      localView.setUint16(12, 0, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, dataBytes.length, true);
      localView.setUint32(22, dataBytes.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, 0, true);
      centralView.setUint16(14, 0, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, dataBytes.length, true);
      centralView.setUint32(24, dataBytes.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + dataBytes.length;
    });

    const centralSize = centralParts.reduce(
      (total, part) => total + part.length,
      0,
    );
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);
    endView.setUint16(20, 0, true);

    const blobParts = [...localParts, ...centralParts, endRecord].map((part) =>
      part.slice(),
    );

    return new Blob(blobParts, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  function downloadFile(
    content: string | Blob,
    name: string,
    mimeType: string,
  ) {
    const blob =
      content instanceof Blob
        ? content
        : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = documentRef.createElement("a");
    link.href = url;
    link.download = name;
    documentRef.body.appendChild(link);
    link.click();
    documentRef.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function buildDownloadName(extension: string) {
    const base =
      state.uploadedFiles.length === 1
        ? state.uploadedFiles[0].name.replace(/\.csv$/i, "")
        : "etsy-multi-month-accounts";
    return `${base}-profit-report.${extension}`;
  }

  function columnNumberToName(value: number) {
    let result = "";
    let number = value;

    while (number > 0) {
      const remainder = (number - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      number = Math.floor((number - 1) / 26);
    }

    return result;
  }

  function xmlEscape(value: string | number) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function escapeCsvValue(value: string) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function crc32(bytes: Uint8Array) {
    let crc = 0 ^ -1;
    for (let index = 0; index < bytes.length; index += 1) {
      crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[index]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function resetToolState() {
    state.uploadedFiles = [];
    state.combinedHeaders = [];
    state.mappings = { ...EMPTY_MAPPINGS };
    state.summaryRows = [];
    state.extraCosts = {};
    state.displaySymbol = "";
    state.companyName = "";
    state.hasDownloadedFile = false;
    processErrorActive = false;

    companyNameInput.value = "";
    csvInput.value = "";
    uploadedFilesList.innerHTML = "";
    uploadedFilesWrap.classList.add("hidden");
    processCard.classList.add("hidden");
    summarySection.classList.add("hidden");
    clearMessage();
    clearSectionStatus("upload");
    clearSectionStatus("process");
    clearSectionStatus("summary");
    clearDownloadReadyMessage();
    submitAnotherButton.classList.add("hidden");
    updateProcessActionVisibility();

    updateUploadedFilesDisplay();
    updateProcessButtonState();
    focusSection(uploadCard);
  }

  function handleUploadButtonClick() {
    csvInput.click();
  }

  function handleCompanyNameChange() {
    const sanitisedCompanyName = sanitiseCompanyName(companyNameInput.value);
    if (companyNameInput.value !== sanitisedCompanyName) {
      companyNameInput.value = sanitisedCompanyName;
    }
    state.companyName = sanitisedCompanyName;
  }

  async function handleCsvInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    await handleSelectedFiles(input.files ?? []);
    input.value = "";
  }

  function handleUploadDragEnter(event: Event) {
    event.preventDefault();
    uploadShell.classList.add("dragover");
  }

  function handleUploadDragLeave(event: Event) {
    event.preventDefault();
    uploadShell.classList.remove("dragover");
  }

  async function handleUploadDrop(event: Event) {
    const dragEvent = event as DragEvent;
    dragEvent.preventDefault();
    uploadShell.classList.remove("dragover");
    await handleSelectedFiles(dragEvent.dataTransfer?.files ?? []);
  }

  function handleUploadShellKeyDown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (
      keyboardEvent.key !== "Enter" &&
      keyboardEvent.key !== " " &&
      keyboardEvent.key !== "Spacebar"
    ) {
      return;
    }

    keyboardEvent.preventDefault();
    csvInput.click();
  }

  function toggleExtraCostsPanel() {
    setExtraCostsPanelOpen(!extraCostsPanel.classList.contains("is-open"));
  }

  function handleExtraCostsToggleKeyDown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (
      keyboardEvent.key !== "Enter" &&
      keyboardEvent.key !== " " &&
      keyboardEvent.key !== "Spacebar"
    ) {
      return;
    }

    keyboardEvent.preventDefault();
    toggleExtraCostsPanel();
  }

  function handleProcessClick() {
    if (!state.uploadedFiles.length) {
      announce(
        "upload",
        "Choose at least one Etsy CSV before generating your profit breakdown.",
        "error",
      );
      return;
    }

    const columnValidation = updateProcessButtonState({ focusOnError: true });
    if (!columnValidation.ok) return;

    const result = buildCombinedMonthlySummary(
      state.uploadedFiles,
      state.mappings,
    );
    if (!result.ok) {
      processErrorActive = true;
      updateProcessActionVisibility();
      announce(
        "process",
        `${result.message}\nCheck the CSV format and try again, or delete the file from the upload list.`,
        "error",
      );
      processHelper.textContent = "";
      focusSection(processCard);
      return;
    }

    state.summaryRows = result.summaryRows ?? [];
    ensureExtraCostBuckets();
    renderCostTable();
    renderSummaryTable();
    summarySection.classList.remove("hidden");
    clearSectionStatus("upload");
    clearSectionStatus("process");

    announce(
      "summary",
      "Your profit breakdown is ready. Add extra costs if you want, or download your report now.",
      "success",
    );
    clearDownloadReadyMessage();
    state.hasDownloadedFile = false;
    processErrorActive = false;
    updateProcessActionVisibility();
    submitAnotherButton.classList.add("hidden");
    updateProcessButtonState();
    focusSection(summarySection);
  }

  function handleDownloadCsvClick() {
    if (!state.summaryRows.length) {
      announce("summary", "Generate your report before downloading.", "error");
      return;
    }

    downloadFile(
      convertSummaryToCsv(getExportRows()),
      buildDownloadName("csv"),
      "text/csv;charset=utf-8;",
    );
    handleSuccessfulDownload();
  }

  function handleDownloadXlsxClick() {
    if (!state.summaryRows.length) {
      announce("summary", "Generate your report before downloading.", "error");
      return;
    }

    downloadFile(
      createXlsxWorkbook(getExportRows()),
      buildDownloadName("xlsx"),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    handleSuccessfulDownload();
  }

  function handleVisibilityChange() {
    if (documentRef.visibilityState === "hidden") {
      const hadSensitiveData =
        state.uploadedFiles.length > 0 || state.summaryRows.length > 0;

      if (!hadSensitiveData) return;

      resetToolState();
      announce(
        "upload",
        "Your uploaded CSV data was cleared when the tab was hidden to protect your privacy. Please upload your files again to continue.",
        "info",
      );
    }
  }

  on(uploadButton, "click", handleUploadButtonClick);
  on(companyNameInput, "input", handleCompanyNameChange);
  on(csvInput, "change", handleCsvInputChange);
  on(uploadShell, "dragenter", handleUploadDragEnter);
  on(uploadShell, "dragover", handleUploadDragEnter);
  on(uploadShell, "dragleave", handleUploadDragLeave);
  on(uploadShell, "dragend", handleUploadDragLeave);
  on(uploadShell, "drop", handleUploadDrop);
  on(uploadShell, "keydown", handleUploadShellKeyDown);
  on(extraCostsToggle, "click", toggleExtraCostsPanel);
  on(extraCostsToggle, "keydown", handleExtraCostsToggleKeyDown);
  on(submitAnotherButton, "click", resetToolState);
  on(cancelButton, "click", resetToolState);
  on(processButton, "click", handleProcessClick);
  on(downloadCsvButton, "click", handleDownloadCsvClick);
  on(downloadXlsxButton, "click", handleDownloadXlsxClick);
  on(windowRef, "pagehide", clearInMemoryCsvData);
  on(documentRef, "visibilitychange", handleVisibilityChange);

  updateUploadedFilesDisplay();
  updateProcessButtonState();
  setExtraCostsPanelOpen(false);
  updateProcessActionVisibility();

  return () => {
    clearInMemoryCsvData();
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

export default function CsvProfitCalculatorClient() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return undefined;
    }

    return setupCsvProfitCalculator(rootRef.current);
  }, []);

  return (
    <div ref={rootRef} className="csv-profit-calculator-page">
      <a className="skip-link" href="#uploadCard">
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
            <li aria-current="page">Etsy CSV Profit Calculator</li>
          </ol>
        </nav>

        <div
          id="statusMessage"
          className="status"
          role="alert"
          aria-live="polite"
        />

        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Free tool · No sign-up · 100% private
            </span>
            <h1 id="hero-heading">
              Turn Your Etsy CSV Into a Clear{" "}
              <span className="hero-highlight">Monthly Profit Report</span>
            </h1>
            <p className="intro">
              Drop your Etsy payment CSV in below and instantly see revenue,
              fees, refunds and the profit you actually keep — broken down by
              month and ready for your accountant.
            </p>
            <div className="hero-benefits">
              {[
                "No sign-up needed",
                "Processed locally in your browser",
                "Download as Excel or CSV",
                "Up to 15 files at once",
              ].map((benefit) => (
                <span key={benefit} className="hero-benefit">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {benefit}
                </span>
              ))}
            </div>
            <div className="hero-cta-row">
              <a className="button button-primary hero-cta" href="#uploadCard">
                Upload Your Etsy CSV
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a className="hero-cta-link" href="#how-it-works">
                See how it works
              </a>
            </div>
          </div>

          <aside className="hero-preview" aria-label="Example monthly report">
            <div className="hero-preview-frame" aria-hidden="true">
              <div className="hero-preview-header">
                <span className="hero-preview-dot dot-red" />
                <span className="hero-preview-dot dot-amber" />
                <span className="hero-preview-dot dot-green" />
                <span className="hero-preview-filename">
                  monthly-profit-report.xlsx
                </span>
              </div>
              <div className="hero-preview-body">
                <div className="hero-preview-row hero-preview-head">
                  <span>Month</span>
                  <span>Revenue</span>
                  <span>Fees</span>
                  <span>Profit</span>
                </div>
                <div className="hero-preview-row">
                  <span>Jan</span>
                  <span>$3,420</span>
                  <span>−$412</span>
                  <span className="hero-preview-profit">$2,318</span>
                </div>
                <div className="hero-preview-row">
                  <span>Feb</span>
                  <span>$2,980</span>
                  <span>−$361</span>
                  <span className="hero-preview-profit">$1,994</span>
                </div>
                <div className="hero-preview-row">
                  <span>Mar</span>
                  <span>$4,210</span>
                  <span>−$502</span>
                  <span className="hero-preview-profit">$2,847</span>
                </div>
                <div className="hero-preview-row hero-preview-total">
                  <span>Total</span>
                  <span>$10,610</span>
                  <span>−$1,275</span>
                  <span className="hero-preview-profit">$7,159</span>
                </div>
              </div>
            </div>
            <p className="hero-preview-caption">
              Example output — your real numbers, cleanly grouped
            </p>
          </aside>
        </section>

        <section
          className="trust-strip"
          aria-label="Why sellers trust this tool"
        >
          <div className="trust-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <strong>100% private</strong>
              <span>No upload, no account</span>
            </div>
          </div>
          <div className="trust-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <div>
              <strong>Instant report</strong>
              <span>Results in under 60 seconds</span>
            </div>
          </div>
          <div className="trust-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div>
              <strong>Excel or CSV</strong>
              <span>Hand straight to your accountant</span>
            </div>
          </div>
          <div className="trust-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <div>
              <strong>Built for Etsy sellers</strong>
              <span>Handles fees, refunds &amp; adjustments</span>
            </div>
          </div>
        </section>

        <section
          className="how-it-works"
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
        >
          <div className="section-eyebrow">How it works</div>
          <h2 id="how-it-works-heading">
            From raw Etsy export to a clean profit report in 3 steps
          </h2>
          <ol className="how-it-works-grid">
            <li>
              <div className="hiw-step-number" aria-hidden="true">
                1
              </div>
              <h3>Export your Etsy CSV</h3>
              <p>
                Etsy → Shop Manager → Finances → Payment account → Monthly
                statements → Download CSV. Repeat for every month you want
                included (up to 15).
              </p>
            </li>
            <li>
              <div className="hiw-step-number" aria-hidden="true">
                2
              </div>
              <h3>Drop the file in</h3>
              <p>
                Drag and drop your CSV (or several at once). Everything is
                parsed locally in your browser — your sales data never leaves
                your device.
              </p>
            </li>
            <li>
              <div className="hiw-step-number" aria-hidden="true">
                3
              </div>
              <h3>Save your monthly report</h3>
              <p>
                Add packaging, ads or other costs to see real profit, then
                download the report as Excel or CSV. Perfect for tax season and
                bookkeepers.
              </p>
            </li>
          </ol>
        </section>

        <section
          className="seo-explainer"
          aria-labelledby="seo-explainer-heading"
        >
          <h2 id="seo-explainer-heading">
            Why Etsy sellers need a proper monthly profit report
          </h2>
          <div className="seo-explainer-grid">
            <div>
              <h3>Etsy CSV exports are messy by design</h3>
              <p>
                Your Etsy payment account export mixes sales, fees, refunds,
                adjustments and tax line-items into one long stream. There is no
                monthly view and no profit calculation — just raw rows.
              </p>
            </div>
            <div>
              <h3>Sales are not the same as profit</h3>
              <p>
                After Etsy transaction fees, listing fees, refunds and your own
                packaging or ad spend, the number you actually keep can be very
                different from your headline sales. A monthly profit report
                makes that clear.
              </p>
            </div>
          </div>
          <div className="seo-explainer-full">
            <h3>Built specifically for Etsy and online sellers</h3>
            <p>
              This calculator understands Etsy&apos;s column names, currency
              formats and placeholder values. It groups everything by month,
              splits revenue from fees and refunds, and lets you layer in your
              own costs — so you can see the real profit on every month of your
              Etsy shop, all in one place.
            </p>
          </div>
        </section>

        <div className="tool-grid">
          <section
            className="card"
            id="uploadCard"
            aria-labelledby="upload-heading"
          >
            <div className="card-header">
              <div className="step-tag">
                <span className="step-badge" aria-hidden="true">
                  1
                </span>
                Step 1 of 3
              </div>
              <h2 id="upload-heading">Choose your Etsy CSV files</h2>
              <p className="helper">
                Export your CSV from Etsy &rarr; Shop Manager &rarr; Finances
                &rarr; Payment Account &rarr; Download CSV. Then drop it here,
                or choose it below to see your report.
              </p>
            </div>

            <div
              id="uploadSectionStatus"
              className="status status-inline"
              role="alert"
              aria-live="polite"
            />

            <div className="company-panel">
              <div className="company-panel-header">
                <span className="company-panel-title">
                  Company or shop name
                </span>
                <span className="optional-badge">Optional</span>
              </div>
              <p className="helper">
                If added, this appears at the top of your downloaded
                spreadsheet.
              </p>
              <input
                id="companyNameInput"
                type="text"
                maxLength={100}
                placeholder="e.g. My Etsy Shop Ltd"
                aria-label="Company or shop name (optional)"
              />
            </div>

            <div
              id="uploadShell"
              className="upload-zone"
              role="button"
              tabIndex={0}
              aria-label="Drop zone — click or drag to upload CSV files"
            >
              <div className="upload-zone-icon" aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-zone-title">Drop your Etsy CSV here</p>
              <p className="upload-zone-or">or</p>
              <div className="upload-zone-actions">
                <button
                  type="button"
                  id="uploadButton"
                  className="button button-primary"
                >
                  Choose CSV to get started
                </button>
                <span
                  id="fileCount"
                  className="file-count-pill"
                  aria-live="polite"
                >
                  0 of 15 CSVs
                </span>
              </div>
              <p className="upload-zone-hint">Accepts .csv files only</p>
              <input
                id="csvInput"
                type="file"
                accept=".csv,text/csv"
                multiple
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <div
                id="uploadedFilesWrap"
                className="uploaded-files-area hidden"
                aria-live="polite"
              >
                <div className="uploaded-files-area-header">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  CSV files ready to analyse
                </div>
                <ul id="uploadedFilesList" className="upload-list" />
              </div>
            </div>

            <div className="upload-trust" role="note">
              <p className="upload-trust-primary">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Processed locally in your browser — nothing is uploaded or
                stored
              </p>
              <p className="upload-trust-secondary">
                For best practice, avoid including personal or sensitive
                information
              </p>
            </div>
          </section>

          <section
            className="card hidden"
            id="processCard"
            aria-labelledby="process-heading"
          >
            <div className="card-header">
              <div className="step-tag">
                <span className="step-badge" aria-hidden="true">
                  2
                </span>
                Step 2 of 3
              </div>
              <h2 id="process-heading">
                Ready to generate your profit breakdown?
              </h2>
              <p className="helper">
                We&apos;ll automatically use the standard Etsy columns we find
                in your CSV. If anything looks wrong in the results, start over
                with a fresh export.
              </p>
            </div>
            <div
              id="processSectionStatus"
              className="status status-inline"
              role="alert"
              aria-live="polite"
            />
            <div className="process-row">
              <button
                type="button"
                id="processButton"
                className="button button-primary"
                disabled
              >
                Generate Profit Breakdown &rarr;
              </button>
              <span id="processHelper" className="helper">
                Choose at least one CSV to continue.
              </span>
              <button
                type="button"
                id="cancelButton"
                className="button button-secondary hidden"
              >
                Start Over
              </button>
            </div>
          </section>

          <section
            className="card hidden"
            id="summarySection"
            aria-labelledby="summary-heading"
          >
            <div className="card-header">
              <div className="step-tag">
                <span className="step-badge" aria-hidden="true">
                  3
                </span>
                Step 3 of 3
              </div>
              <h2 id="summary-heading">Your profit breakdown is ready</h2>
              <p className="helper">
                Review your figures below. Add extra costs if you want, then
                save your report.
              </p>
            </div>

            <div
              id="summarySectionStatus"
              className="status status-inline"
              role="alert"
              aria-live="polite"
            />

            <div className="summary-layout">
              <div className="extra-costs-panel" id="extraCostsPanel">
                <div
                  className="extra-costs-header"
                  id="extraCostsToggle"
                  role="button"
                  aria-expanded="false"
                  aria-controls="extraCostsBody"
                  tabIndex={0}
                >
                  <div className="extra-costs-title-group">
                    <div className="extra-costs-title">
                      Add extra monthly costs
                    </div>
                    <div className="extra-costs-subtitle">
                      Optional &mdash; packaging, ads, subscriptions &amp; more
                    </div>
                  </div>
                  <svg
                    className="extra-costs-toggle-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className="extra-costs-body" id="extraCostsBody">
                  <p className="helper">
                    Enter any extra business costs for each month. These are
                    deducted from your Net Received to calculate Estimated
                    Profit.
                  </p>
                  <div className="table-wrap cost-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Packaging</th>
                          <th>Shipping Supplies</th>
                          <th>Ads</th>
                          <th>Subscriptions</th>
                          <th>Other Costs</th>
                        </tr>
                      </thead>
                      <tbody id="costTableBody" />
                    </table>
                  </div>
                </div>
              </div>

              <div>
                <div className="summary-table-header">
                  <h3>Your monthly profit breakdown</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Revenue</th>
                        <th>Etsy Fees</th>
                        <th>Refunds</th>
                        <th>Adjustments</th>
                        <th>Net Received</th>
                        <th>Extra Costs</th>
                        <th>Estimated Profit</th>
                      </tr>
                    </thead>
                    <tbody id="summaryTableBody" />
                    <tfoot id="summaryTableFoot" />
                  </table>
                </div>
              </div>
            </div>

            <div className="download-panel">
              <div className="download-panel-title">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save your report
              </div>
              <p className="download-hint">
                Choose your preferred format. The Excel download includes your
                company name and styling.
              </p>
              <div className="download-formats">
                <button
                  type="button"
                  id="downloadXlsxButton"
                  className="button button-primary"
                >
                  Save for Excel
                </button>
                <button
                  type="button"
                  id="downloadCsvButton"
                  className="button button-primary"
                >
                  Save as CSV
                </button>
              </div>
              <div
                id="downloadReadyMessage"
                className="status status-inline"
                role="alert"
                aria-live="polite"
              />
              <div className="secondary-actions">
                <button
                  type="button"
                  id="submitAnotherButton"
                  className="button button-secondary hidden"
                >
                  Analyse another CSV &rarr;
                </button>
              </div>
            </div>

            <p className="disclaimer">
              <strong>Please note:</strong> This tool provides a simplified
              summary for reference only. It is not a substitute for
              professional accounting advice. Always verify your figures with a
              qualified accountant, and check your report before use as
              Etsy&apos;s CSV format can vary.
            </p>
          </section>
        </div>

        <section className="faq" aria-labelledby="faq-heading">
          <div className="section-eyebrow">Frequently asked questions</div>
          <h2 id="faq-heading">
            Etsy CSV profit calculator — questions answered
          </h2>
          <div className="faq-list">
            {CSV_CALCULATOR_FAQS.map((faq, index) => (
              <details
                key={faq.question}
                className="faq-item"
                open={index === 0}
              >
                <summary>
                  <span>{faq.question}</span>
                  <svg
                    className="faq-chevron"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="seo-keywords"
          aria-label="Etsy profit tracking guide"
        >
          <div className="seo-keywords-grid">
            <div>
              <h2>Why monthly profit reports matter for Etsy sellers</h2>
              <p>
                Etsy&apos;s dashboard shows sales, not profit. After fees,
                refunds and your own costs, the number you actually keep is
                often very different. A clean monthly Etsy profit report makes
                that clear &mdash; and makes tax time significantly less
                stressful.
              </p>
            </div>
            <div>
              <h2>Your data stays on your device</h2>
              <p>
                Your CSV is handled entirely in your browser. It is not uploaded
                or stored by this tool, and we do not need an account or email
                address to use it.
              </p>
            </div>
          </div>
        </section>

        <section className="promo" aria-label="More tools">
          <div>
            <h2>Keep your accounts organised year-round</h2>
            <p className="promo-lead">
              Once you have your clean monthly profit report, the next step is
              keeping your books organised. Our printable accounting ledger is
              designed for small business owners — a clear, simple layout you
              can print and fill in or use digitally. No complicated software,
              no subscription required.
            </p>
            <Link
              className="button button-primary promo-button"
              href="/templates/accounting-ledger/printable-accounting-ledger-accounts-receivable"
            >
              View Monthly Accounting Ledger &rarr;
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          &copy;{" "}
          <a
            href="https://www.simplebiztoolkit.com"
            rel="noreferrer"
            referrerPolicy="no-referrer"
          >
            SimpleBizToolkit.com
          </a>{" "}
          Free tools and templates for small business owners. Your CSV data
          stays in your browser.
        </p>
        <p className="footer-disclaimer">
          This tool is not affiliated with or endorsed by Etsy.
        </p>
      </footer>
    </div>
  );
}
