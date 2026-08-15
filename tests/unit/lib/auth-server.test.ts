import { describe, it, expect, vi, beforeEach } from "vitest";

const getSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-test": "1" }),
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

const dbUser = (over: Record<string, unknown> = {}) => ({
  id: "u1",
  email: "a@b.com",
  name: "A",
  image: null,
  role: "citizen",
  active: true,
  ...over,
});

async function mockDbRows(rows: unknown[]) {
  const { db } = await import("@/db");
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain(rows));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getServerSession", () => {
  it("returns null when there is no better-auth session", async () => {
    getSession.mockResolvedValue(null);
    const { getServerSession } = await import("@/lib/auth-server");
    expect(await getServerSession()).toBeNull();
  });

  it("returns the user revalidated against the database", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser()]);
    const { getServerSession } = await import("@/lib/auth-server");
    const s = await getServerSession();
    expect(s?.user).toMatchObject({ id: "u1", role: "citizen", active: true });
    expect(getSession).toHaveBeenCalled();
  });

  it("returns null when the user no longer exists", async () => {
    getSession.mockResolvedValue({ user: { id: "u-ghost" } });
    await mockDbRows([]);
    const { getServerSession } = await import("@/lib/auth-server");
    expect(await getServerSession()).toBeNull();
  });

  // Régression C-3 : un compte désactivé conservait tous ses droits sur le web
  // (Server Actions, pages, panneau d'administration) tant que son cookie de
  // session restait valide — seule l'API vérifiait `active`.
  it("returns null when the account has been deactivated", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser({ active: false })]);
    const { getServerSession } = await import("@/lib/auth-server");
    expect(await getServerSession()).toBeNull();
  });

  // Le rôle vient de la base, jamais du cookie : une rétrogradation prend
  // effet immédiatement, sans attendre l'expiration de la session.
  it("reads the role from the database, not from the session cookie", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", role: "super_admin" } });
    await mockDbRows([dbUser({ role: "citizen" })]);
    const { getServerSession } = await import("@/lib/auth-server");
    const s = await getServerSession();
    expect(s?.user.role).toBe("citizen");
  });
});

describe("server action guards", () => {
  it("requireUser throws when unauthenticated", async () => {
    getSession.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/auth-server");
    await expect(requireUser()).rejects.toThrow("Non authentifié");
  });

  it("requireAdmin rejects a citizen", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser({ role: "citizen" })]);
    const { requireAdmin } = await import("@/lib/auth-server");
    await expect(requireAdmin()).rejects.toThrow("Accès refusé");
  });

  it("requireAdmin accepts admin and super_admin", async () => {
    const { requireAdmin } = await import("@/lib/auth-server");

    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser({ role: "admin" })]);
    expect((await requireAdmin()).role).toBe("admin");

    await mockDbRows([dbUser({ role: "super_admin" })]);
    expect((await requireAdmin()).role).toBe("super_admin");
  });

  it("requireSuperAdmin rejects a plain admin", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser({ role: "admin" })]);
    const { requireSuperAdmin } = await import("@/lib/auth-server");
    await expect(requireSuperAdmin()).rejects.toThrow("super-administrateur");
  });

  // Un administrateur désactivé ne doit plus franchir la garde admin.
  it("requireAdmin rejects a deactivated admin", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" } });
    await mockDbRows([dbUser({ role: "admin", active: false })]);
    const { requireAdmin } = await import("@/lib/auth-server");
    await expect(requireAdmin()).rejects.toThrow("Non authentifié");
  });
});
