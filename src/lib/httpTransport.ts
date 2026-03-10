type ParsedResponse = {
  payload: unknown;
  isJson: boolean;
  contentType: string;
};

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
};

export function unwrapDataEnvelope<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export function extractErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  const problem = parseProblemDetails(payload);
  if (problem) {
    const headline = problem.title?.trim() || "Request failed";
    const detail = problem.detail?.trim();
    if (detail && detail !== headline) {
      return `${headline}: ${detail}`;
    }

    const validationDetails = problem.errors
      ? Object.values(problem.errors)
          .flat()
          .map((entry) => entry.trim())
          .filter(Boolean)
          .join(" ")
      : "";

    if (validationDetails) {
      return `${headline}: ${validationDetails}`;
    }

    return headline;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: string; error?: string };
    if (candidate.message) return candidate.message;
    if (candidate.error) return candidate.error;
  }

  return fallback;
}

export function parseProblemDetails(payload: unknown): ProblemDetails | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const candidate = payload as ProblemDetails;
  const hasProblemField =
    typeof candidate.title === "string" ||
    typeof candidate.detail === "string" ||
    typeof candidate.status === "number" ||
    typeof candidate.type === "string" ||
    typeof candidate.instance === "string" ||
    (candidate.errors && typeof candidate.errors === "object");

  return hasProblemField ? candidate : null;
}

export async function sendHttpRequest(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  return fetch(url, options);
}

export async function parseHttpResponse(
  response: Response,
): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return {
    payload,
    isJson,
    contentType,
  };
}
