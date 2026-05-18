import { describe, it, expect, beforeEach, vi } from "vitest";

const insertChain = () => ({
  values: vi.fn().mockResolvedValue(undefined),
});

const selectChain = (rows: unknown[] = []) => ({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(rows),
    }),
  }),
});

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => selectChain()),
    insert: vi.fn(() => insertChain()),
  },
}));

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
}));

describe("createAdminUserCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when name/email/password are missing", async () => {
    const { createAdminUserCore } = await import("@/lib/admin-user");
    const result = await createAdminUserCore({ name: "", email: "", password: "", role: "admin" });
    expect("error" in result && result.error.code).toBe("INVALID_INPUT");
  });

  it("rejects password shorter than 8 chars", async () => {
    const { createAdminUserCore } = await import("@/lib/admin-user");
    const result = await createAdminUserCore({
      name: "X",
      email: "x@x.com",
      password: "short",
      role: "admin",
    });
    expect("error" in result && result.error.code).toBe("INVALID_INPUT");
  });

  it("rejects invalid role", async () => {
    const { createAdminUserCore } = await import("@/lib/admin-user");
    const result = await createAdminUserCore({
      name: "X",
      email: "x@x.com",
      password: "Password123!",
      role: "citizen" as never,
    });
    expect("error" in result && result.error.code).toBe("INVALID_INPUT");
  });

  it("rejects when email is already taken", async () => {
    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain([{ id: "u1" }]));

    const { createAdminUserCore } = await import("@/lib/admin-user");
    const result = await createAdminUserCore({
      name: "X",
      email: "exists@x.com",
      password: "Password123!",
      role: "admin",
    });
    expect("error" in result && result.error.code).toBe("EMAIL_TAKEN");
  });

  it("creates user + account when input is valid", async () => {
    const { db } = await import("@/db");
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(selectChain([]));

    const { createAdminUserCore } = await import("@/lib/admin-user");
    const result = await createAdminUserCore({
      name: "  Bob  ",
      email: " BOB@TEST.com ",
      password: "Password123!",
      role: "moderator",
    });
    expect("id" in result).toBe(true);
    expect((db.insert as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});
