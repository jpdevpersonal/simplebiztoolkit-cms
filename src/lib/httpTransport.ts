type ParsedResponse = {
  payload: unknown;
  isJson: boolean;
  contentType: string;
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
