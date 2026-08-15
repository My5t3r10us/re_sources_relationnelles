import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, enforceRateLimit, requestIdentity } from "@/lib/rate-limit";
import { resetDb } from "../setup/db";

/**
 * Régression E-3 : aucune limitation de débit n'existait, ni sur `/api/v1`
 * ni sur les Server Actions. La connexion, la vérification TOTP à 6 chiffres,
 * l'upload de 50 Mo et le signalement étaient tous librement répétables.
 */
beforeEach(async () => {
  await resetDb();
});

const rule = { max: 3, windowSec: 3600 };

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", async () => {
    for (let i = 0; i < rule.max; i++) {
      const verdict = await checkRateLimit("test", "user:u1", rule);
      expect(verdict.allowed).toBe(true);
    }

    const blocked = await checkRateLimit("test", "user:u1", rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("counts each identity separately", async () => {
    for (let i = 0; i < rule.max; i++) {
      await checkRateLimit("test", "user:u1", rule);
    }
    expect((await checkRateLimit("test", "user:u1", rule)).allowed).toBe(false);
    // Un autre utilisateur ne doit pas être affecté.
    expect((await checkRateLimit("test", "user:u2", rule)).allowed).toBe(true);
  });

  it("counts each scope separately", async () => {
    for (let i = 0; i < rule.max; i++) {
      await checkRateLimit("upload", "user:u1", rule);
    }
    expect((await checkRateLimit("upload", "user:u1", rule)).allowed).toBe(false);
    expect((await checkRateLimit("report", "user:u1", rule)).allowed).toBe(true);
  });

  it("reopens once the window has elapsed", async () => {
    const shortRule = { max: 1, windowSec: 1 };
    expect((await checkRateLimit("court", "user:u1", shortRule)).allowed).toBe(true);
    expect((await checkRateLimit("court", "user:u1", shortRule)).allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 1100));
    expect((await checkRateLimit("court", "user:u1", shortRule)).allowed).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("returns null while under the limit", async () => {
    expect(await enforceRateLimit("test", "user:u1", rule)).toBeNull();
  });

  it("returns a 429 carrying Retry-After once exceeded", async () => {
    for (let i = 0; i < rule.max; i++) {
      await enforceRateLimit("test", "user:u1", rule);
    }
    const res = await enforceRateLimit("test", "user:u1", rule);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(Number(res!.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});

describe("requestIdentity", () => {
  it("prefers the user id when authenticated", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4" } });
    expect(requestIdentity(req, "u1")).toBe("user:u1");
  });

  it("falls back to the first forwarded ip when anonymous", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(requestIdentity(req, null)).toBe("ip:1.2.3.4");
  });

  it("falls back to a constant when no ip is available", () => {
    expect(requestIdentity(new Request("http://x"), null)).toBe("ip:unknown");
  });
});
