import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, errorMessage } from "@/services/api-client";

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("returns data from a successful response", async () => {
    mockFetch(200, { data: [{ id: "1" }] });
    await expect(apiRequest("/api/invoices")).resolves.toEqual([{ id: "1" }]);
  });

  it("throws ApiError with the server's message and status", async () => {
    mockFetch(409, { error: "Cannot change status from APPROVED to REJECTED" });
    const err = await apiRequest("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, message: "Cannot change status from APPROVED to REJECTED" });
  });

  it("throws ApiError with status 0 when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 0 });
  });

  it("sends JSON only when there is a body", async () => {
    mockFetch(200, { data: null });
    await apiRequest("/api/x", { method: "PATCH", body: "{}" });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  });
});

describe("errorMessage", () => {
  it("shows ApiError messages and hides anything else", () => {
    expect(errorMessage(new ApiError("Invoice not found", 404))).toBe("Invoice not found");
    expect(errorMessage(new Error("internal detail"), "Could not load")).toBe("Could not load");
  });
});
