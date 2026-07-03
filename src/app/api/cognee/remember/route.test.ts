import { beforeEach, describe, expect, it, vi } from "vitest";

const cogneeRememberMock = vi.fn();

vi.mock("@/lib/cognee", () => ({ cogneeRemember: cogneeRememberMock }));
vi.mock("@/lib/db/queries", () => ({
  NoPatientsError: class NoPatientsError extends Error {},
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitedError: class RateLimitedError extends Error {},
}));

const { POST } = await import("./route");

function req(body: unknown) {
  return new Request("http://localhost/api/cognee/remember", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/cognee/remember", () => {
  it("400s when text is missing or blank", async () => {
    const res = await POST(req({ text: "" }));
    expect(res.status).toBe(400);
  });

  it("defaults datasetName to hello_world when omitted", async () => {
    cogneeRememberMock.mockResolvedValue({ status: 200, body: { ok: true } });
    await POST(req({ text: "hi" }));
    expect(cogneeRememberMock).toHaveBeenCalledWith("hi", "hello_world");
  });

  it("uses the provided datasetName when present", async () => {
    cogneeRememberMock.mockResolvedValue({ status: 200, body: { ok: true } });
    await POST(req({ text: "hi", datasetName: "custom-ds" }));
    expect(cogneeRememberMock).toHaveBeenCalledWith("hi", "custom-ds");
  });

  it("returns 500 with the error message when the Cognee call throws", async () => {
    cogneeRememberMock.mockRejectedValue(new Error("upstream error"));
    const res = await POST(req({ text: "hi" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "upstream error" });
  });
});
