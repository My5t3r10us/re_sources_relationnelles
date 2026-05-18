import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

const selectChain = (rows: unknown[] = []) => ({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(rows),
    }),
  }),
});

vi.mock("@/db", () => ({
  db: { select: vi.fn(() => selectChain()) },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("api-auth", () => {
  describe("getApiSession", () => {
    it("returns null when no better-auth session", async () => {
      getSession.mockResolvedValue(null);
      const { getApiSession } = await import("@/lib/api-auth");
      expect(await getApiSession(new Request("http://x"))).toBeNull();
    });

    it("returns null when user does not exist in DB", async () => {
      getSession.mockResolvedValue({ user: { id: "u-ghost" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain([]));
      const { getApiSession } = await import("@/lib/api-auth");
      expect(await getApiSession(new Request("http://x"))).toBeNull();
    });

    it("returns null when user is inactive", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "citizen", active: false }]),
      );
      const { getApiSession } = await import("@/lib/api-auth");
      expect(await getApiSession(new Request("http://x"))).toBeNull();
    });

    it("returns active user", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "citizen", active: true }]),
      );
      const { getApiSession } = await import("@/lib/api-auth");
      const u = await getApiSession(new Request("http://x"));
      expect(u?.id).toBe("u1");
    });
  });

  describe("requireApiAuth", () => {
    it("throws a 401 Response when not authenticated", async () => {
      getSession.mockResolvedValue(null);
      const { requireApiAuth } = await import("@/lib/api-auth");
      try {
        await requireApiAuth(new Request("http://x"));
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(Response);
        expect((e as Response).status).toBe(401);
      }
    });
  });

  describe("requireApiAdmin", () => {
    it("forbids non-admin role", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "citizen", active: true }]),
      );
      const { requireApiAdmin } = await import("@/lib/api-auth");
      try {
        await requireApiAdmin(new Request("http://x"));
        expect.fail("should have thrown");
      } catch (e) {
        expect((e as Response).status).toBe(403);
      }
    });

    it("allows admin", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "admin", active: true }]),
      );
      const { requireApiAdmin } = await import("@/lib/api-auth");
      const u = await requireApiAdmin(new Request("http://x"));
      expect(u.role).toBe("admin");
    });
  });

  describe("requireApiSuperAdmin", () => {
    it("forbids admin role (only super_admin allowed)", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "admin", active: true }]),
      );
      const { requireApiSuperAdmin } = await import("@/lib/api-auth");
      try {
        await requireApiSuperAdmin(new Request("http://x"));
        expect.fail("should have thrown");
      } catch (e) {
        expect((e as Response).status).toBe(403);
      }
    });

    it("allows super_admin", async () => {
      getSession.mockResolvedValue({ user: { id: "u1" } });
      const { db } = await import("@/db");
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue(
        selectChain([{ id: "u1", email: "a@b", name: "A", role: "super_admin", active: true }]),
      );
      const { requireApiSuperAdmin } = await import("@/lib/api-auth");
      const u = await requireApiSuperAdmin(new Request("http://x"));
      expect(u.role).toBe("super_admin");
    });
  });
});
