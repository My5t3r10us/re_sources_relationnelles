import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/db";
import { authLog } from "@/db/schema";
import { POST } from "@/app/api/v1/maintenance/purge-auth-log/route";
import { setupApiHarness } from "../setup/api-harness";

const harness = setupApiHarness([
  { path: "/api/v1/maintenance/purge-auth-log", handlers: { POST } },
]);

const SECRET = "secret-de-cron-pour-les-tests";
const originalSecret = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("POST /api/v1/maintenance/purge-auth-log", () => {
  it("refuse un appel sans en-tête d'autorisation", async () => {
    const res = await harness.req().post("/api/v1/maintenance/purge-auth-log");

    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe("UNAUTHORIZED");
  });

  it("refuse un secret incorrect", async () => {
    const res = await harness
      .req()
      .post("/api/v1/maintenance/purge-auth-log")
      .set("Authorization", "Bearer mauvais-secret");

    expect(res.status).toBe(401);
  });

  it("refuse le service quand aucun secret n'est configuré", async () => {
    // Une purge ouverte permettrait d'effacer les traces d'audit sur demande.
    delete process.env.CRON_SECRET;

    const res = await harness
      .req()
      .post("/api/v1/maintenance/purge-auth-log")
      .set("Authorization", "Bearer peu-importe");

    expect(res.status).toBe(503);
    expect(res.body.error?.code).toBe("NOT_CONFIGURED");
  });

  it("purge les entrées expirées avec le bon secret", async () => {
    await db.insert(authLog).values([
      {
        id: "expiree",
        event: "login",
        ipAddress: "203.0.113.1",
        createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
      },
      {
        id: "fraiche",
        event: "login",
        ipAddress: "203.0.113.2",
        createdAt: new Date(),
      },
    ]);

    const res = await harness
      .req()
      .post("/api/v1/maintenance/purge-auth-log")
      .set("Authorization", `Bearer ${SECRET}`);

    expect(res.status).toBe(200);
    expect(res.body.data.supprimees).toBe(1);
    expect(res.body.data.retentionDays).toBe(180);

    const restantes = await db.select().from(authLog);
    // La purge se journalise elle-même : l'entrée fraîche plus la trace.
    expect(restantes.some((l) => l.id === "fraiche")).toBe(true);
    expect(restantes.some((l) => l.event === "authlog.purged")).toBe(true);
  });
});
