import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/categories/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestCategory } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/categories", handlers: { GET } },
]);

describe("GET /api/v1/categories", () => {
  it("returns an empty array on empty DB", async () => {
    const res = await harness.req().get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], error: null });
  });

  it("returns categories ordered by name asc", async () => {
    await createTestCategory({ name: "Zeta", slug: "z" });
    await createTestCategory({ name: "Alpha", slug: "a" });
    await createTestCategory({ name: "Médian", slug: "m" });
    const res = await harness.req().get("/api/v1/categories");
    expect(res.status).toBe(200);
    const names = res.body.data.map((c: { name: string }) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
