import { describe, it, expect } from "vitest";
import { apiSuccess, apiError } from "@/lib/api-response";

describe("api-response", () => {
  describe("apiSuccess", () => {
    it("returns 200 with data and null error by default", async () => {
      const res = apiSuccess({ foo: "bar" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ data: { foo: "bar" }, error: null });
    });

    it("includes meta when provided", async () => {
      const res = apiSuccess([1, 2], { page: 1, total: 2 });
      const body = await res.json();
      expect(body).toEqual({ data: [1, 2], error: null, meta: { page: 1, total: 2 } });
    });

    it("respects custom status code", async () => {
      const res = apiSuccess({ id: "x" }, undefined, 201);
      expect(res.status).toBe(201);
    });

    it("omits meta key entirely when not provided", async () => {
      const res = apiSuccess(null);
      const body = await res.json();
      expect(body).not.toHaveProperty("meta");
    });
  });

  describe("apiError", () => {
    it("returns the given status with code+message and null data", async () => {
      const res = apiError("FORBIDDEN", "Accès refusé", 403);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body).toEqual({
        data: null,
        error: { code: "FORBIDDEN", message: "Accès refusé" },
      });
    });

    it("handles 401, 404, 500 codes", async () => {
      for (const status of [401, 404, 500]) {
        const res = apiError("CODE", "msg", status);
        expect(res.status).toBe(status);
      }
    });
  });
});
