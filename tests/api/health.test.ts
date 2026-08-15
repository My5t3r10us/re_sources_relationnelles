import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";
import { setupApiHarness } from "../setup/api-harness";
import pkg from "@/package.json";

const harness = setupApiHarness([{ path: "/api/health", handlers: { GET } }]);

describe("GET /api/health", () => {
  it("répond 200 quand la base est joignable", async () => {
    const res = await harness.req().get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      status: "ok",
      version: pkg.version,
      database: { status: "ok" },
    });
    expect(typeof res.body.data.database.latencyMs).toBe("number");
    expect(typeof res.body.data.uptime).toBe("number");
  });

  it("ne demande aucune authentification", async () => {
    // La sonde doit rester appelable par un orchestrateur, sans en-tête.
    const res = await harness.req().get("/api/health");
    expect(res.status).not.toBe(401);
  });

  it("ne divulgue ni URL de connexion ni identifiants", async () => {
    const res = await harness.req().get("/api/health");
    const body = JSON.stringify(res.body);

    expect(body).not.toContain("postgres://");
    expect(body).not.toMatch(/password/i);
  });
});
