import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("sessions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("generateShareCode", () => {
    it("returns an 8-character code from the unambiguous alphabet", async () => {
      const { generateShareCode } = await import("@/lib/sessions");
      const code = generateShareCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    });

    it("excludes confusing characters I, O, 0, 1", async () => {
      const { generateShareCode } = await import("@/lib/sessions");
      for (let i = 0; i < 100; i++) {
        const code = generateShareCode();
        expect(code).not.toMatch(/[IO01]/);
      }
    });

    it("produces different codes on repeated calls (statistically)", async () => {
      const { generateShareCode } = await import("@/lib/sessions");
      const codes = new Set(Array.from({ length: 50 }, () => generateShareCode()));
      expect(codes.size).toBeGreaterThan(40);
    });
  });

  describe("generateUniqueShareCode", () => {
    it("returns first generated code when none exist in DB", async () => {
      const { db } = await import("@/db");
      const limit = vi.fn().mockResolvedValue([]);
      const where = vi.fn().mockReturnValue({ limit });
      const from = vi.fn().mockReturnValue({ where });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from });

      const { generateUniqueShareCode } = await import("@/lib/sessions");
      const code = await generateUniqueShareCode();
      expect(code).toHaveLength(8);
    });

    it("throws if max retries are exhausted", async () => {
      const { db } = await import("@/db");
      const limit = vi.fn().mockResolvedValue([{ id: "exists" }]);
      const where = vi.fn().mockReturnValue({ limit });
      const from = vi.fn().mockReturnValue({ where });
      (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from });

      const { generateUniqueShareCode } = await import("@/lib/sessions");
      await expect(generateUniqueShareCode(2)).rejects.toThrow(/unique/i);
    });
  });
});
