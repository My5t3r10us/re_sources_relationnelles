import { describe, it, expect } from "vitest";
import { GET, PUT } from "@/app/api/v1/me/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/me", handlers: { GET, PUT } },
]);

describe("/api/v1/me", () => {
  describe("GET", () => {
    it("requires authentication", async () => {
      const res = await harness.req().get("/api/v1/me");
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("returns the profile of the authenticated user", async () => {
      const u = await createTestUser({ name: "Alice", email: "alice@me.test" });
      const res = await harness.req().get("/api/v1/me").set("Authorization", `Bearer ${u.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: u.id, email: "alice@me.test", name: "Alice" });
    });
  });

  describe("PUT", () => {
    it("requires authentication", async () => {
      const res = await harness.req().put("/api/v1/me").send({ name: "X" });
      expect(res.status).toBe(401);
    });

    it("updates the user profile fields", async () => {
      const u = await createTestUser();
      const res = await harness
        .req()
        .put("/api/v1/me")
        .set("Authorization", `Bearer ${u.token}`)
        .send({ name: "Bobby", firstName: "Bob", lastName: "Marley" });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: "Bobby", firstName: "Bob", lastName: "Marley" });
    });

    it("ignores undefined fields", async () => {
      const u = await createTestUser({ name: "Carol" });
      const res = await harness
        .req()
        .put("/api/v1/me")
        .set("Authorization", `Bearer ${u.token}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Carol");
    });
  });
});
