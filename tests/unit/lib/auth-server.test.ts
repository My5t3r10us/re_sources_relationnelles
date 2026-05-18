import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-test": "1" }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getServerSession", () => {
  it("returns the session from better-auth using next/headers", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    const { getServerSession } = await import("@/lib/auth-server");
    const s = await getServerSession();
    expect(s).toEqual({ user: { id: "u1" } });
    expect(getSession).toHaveBeenCalled();
  });

  it("returns null when there is no session", async () => {
    getSession.mockResolvedValue(null);
    const { getServerSession } = await import("@/lib/auth-server");
    expect(await getServerSession()).toBeNull();
  });
});
