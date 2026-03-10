const DEV_API_FALLBACK = "http://localhost:5117";

function isDevLikeEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

function getDevFallback(): string {
  return isDevLikeEnvironment() ? DEV_API_FALLBACK : "";
}

export function getApiBaseUrlForServer(): string {
  const base =
    process.env.API_URL ||
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    getDevFallback();

  if (!base && process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing API base URL for server builds. Set API_URL or NEXT_PUBLIC_API_URL in your CI environment.",
    );
  }

  return base;
}

export function getApiBaseUrlForBrowser(): string {
  return process.env.NEXT_PUBLIC_API_URL || getDevFallback();
}

export function getApiBaseUrl(): string {
  return typeof window === "undefined"
    ? getApiBaseUrlForServer()
    : getApiBaseUrlForBrowser();
}
