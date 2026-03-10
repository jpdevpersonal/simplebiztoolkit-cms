import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractErrorMessage,
  parseProblemDetails,
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "./httpTransport";

describe("httpTransport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("unwrapDataEnvelope", () => {
    it("returns nested data when payload has data envelope", () => {
      const result = unwrapDataEnvelope<{ id: number }>({ data: { id: 7 } });
      expect(result).toEqual({ id: 7 });
    });

    it("returns payload as-is when no data envelope exists", () => {
      const result = unwrapDataEnvelope<{ id: number }>({ id: 3 });
      expect(result).toEqual({ id: 3 });
    });
  });

  describe("extractErrorMessage", () => {
    it("prefers plain string payload", () => {
      expect(extractErrorMessage("oops", "fallback")).toBe("oops");
    });

    it("uses message field from object payload", () => {
      expect(extractErrorMessage({ message: "bad request" }, "fallback")).toBe(
        "bad request",
      );
    });

    it("uses error field when message is missing", () => {
      expect(extractErrorMessage({ error: "forbidden" }, "fallback")).toBe(
        "forbidden",
      );
    });

    it("returns fallback when payload has no useful value", () => {
      expect(extractErrorMessage({}, "fallback")).toBe("fallback");
    });

    it("formats RFC 7807 ProblemDetails using title/detail", () => {
      expect(
        extractErrorMessage(
          { title: "Forbidden", detail: "Missing role", status: 403 },
          "fallback",
        ),
      ).toBe("Forbidden: Missing role");
    });
  });

  describe("parseProblemDetails", () => {
    it("returns object for RFC 7807 payload", () => {
      expect(
        parseProblemDetails({
          title: "Validation failed",
          status: 400,
          errors: { email: ["Required"] },
        }),
      ).toEqual({
        title: "Validation failed",
        status: 400,
        errors: { email: ["Required"] },
      });
    });

    it("returns null for non-problem payload", () => {
      expect(parseProblemDetails({ message: "oops" })).toBeNull();
    });
  });

  describe("sendHttpRequest", () => {
    it("delegates to fetch with url and options", async () => {
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response("ok"));

      const options: RequestInit = { method: "POST", body: "{}" };
      const response = await sendHttpRequest("https://example.com", options);

      expect(fetchMock).toHaveBeenCalledWith("https://example.com", options);
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("parseHttpResponse", () => {
    it("parses json payload when content type is application/json", async () => {
      const response = new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });

      const result = await parseHttpResponse(response);

      expect(result.isJson).toBe(true);
      expect(result.payload).toEqual({ ok: true });
      expect(result.contentType).toContain("application/json");
    });

    it("returns null payload when json parsing fails", async () => {
      const response = {
        headers: {
          get: () => "application/json",
        },
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      };

      const result = await parseHttpResponse(response as unknown as Response);

      expect(result.isJson).toBe(true);
      expect(result.payload).toBeNull();
    });

    it("parses text payload when content type is not json", async () => {
      const response = new Response("hello", {
        headers: { "content-type": "text/plain" },
      });

      const result = await parseHttpResponse(response);

      expect(result.isJson).toBe(false);
      expect(result.payload).toBe("hello");
      expect(result.contentType).toBe("text/plain");
    });

    it("returns empty string when text parsing fails", async () => {
      const response = {
        headers: {
          get: () => "text/plain",
        },
        text: vi.fn().mockRejectedValue(new Error("cannot read body")),
      };

      const result = await parseHttpResponse(response as unknown as Response);

      expect(result.isJson).toBe(false);
      expect(result.payload).toBe("");
    });
  });
});
