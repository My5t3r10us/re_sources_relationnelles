import { describe, it, expect } from "vitest";
import { POST as createSession } from "@/app/api/v1/resources/[id]/sessions/route";
import { GET as sessionGet, DELETE as sessionDelete } from "@/app/api/v1/sessions/[code]/route";
import { POST as join } from "@/app/api/v1/sessions/[code]/join/route";
import { POST as leave } from "@/app/api/v1/sessions/[code]/leave/route";
import { GET as messagesGet, POST as messagesPost } from "@/app/api/v1/sessions/[code]/messages/route";
import { setupApiHarness } from "../../setup/api-harness";
import { createTestUser, createTestResource } from "../../setup/db";

const harness = setupApiHarness([
  { path: "/api/v1/resources/[id]/sessions", handlers: { POST: createSession } },
  { path: "/api/v1/sessions/[code]", handlers: { GET: sessionGet, DELETE: sessionDelete } },
  { path: "/api/v1/sessions/[code]/join", handlers: { POST: join } },
  { path: "/api/v1/sessions/[code]/leave", handlers: { POST: leave } },
  { path: "/api/v1/sessions/[code]/messages", handlers: { GET: messagesGet, POST: messagesPost } },
]);

async function createCollabSession(token: string, resourceId: string) {
  return await harness
    .req()
    .post(`/api/v1/resources/${resourceId}/sessions`)
    .set("Authorization", `Bearer ${token}`);
}

describe("Sessions API", () => {
  it("POST /resources/[id]/sessions requires auth", async () => {
    const res = await harness.req().post("/api/v1/resources/x/sessions");
    expect(res.status).toBe(401);
  });

  it("POST refuses non-collaborative resources", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id, status: "published", mediaType: "article" });
    const res = await createCollabSession(u.token, r.id);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATE");
  });

  it("POST refuses unpublished resources", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id, status: "draft", mediaType: "exercise" });
    const res = await createCollabSession(u.token, r.id);
    expect(res.status).toBe(400);
  });

  it("POST creates a session with share code for exercise/protocol", async () => {
    const u = await createTestUser();
    const r = await createTestResource({ authorId: u.id, status: "published", mediaType: "exercise" });
    const res = await createCollabSession(u.token, r.id);
    expect(res.status).toBe(201);
    expect(res.body.data.shareCode).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("GET /sessions/[code] requires auth", async () => {
    const res = await harness.req().get("/api/v1/sessions/ABC");
    expect(res.status).toBe(401);
  });

  it("GET 404 unknown code", async () => {
    const u = await createTestUser();
    const res = await harness.req().get("/api/v1/sessions/UNKNOWNX").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(404);
  });

  it("POST /join idempotent", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "protocol" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    const u = await createTestUser();
    const a = await harness.req().post(`/api/v1/sessions/${code}/join`).set("Authorization", `Bearer ${u.token}`);
    const b = await harness.req().post(`/api/v1/sessions/${code}/join`).set("Authorization", `Bearer ${u.token}`);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });

  it("POST /messages forbids non-participants", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;
    const stranger = await createTestUser();
    const res = await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .send({ content: "hey" });
    expect(res.status).toBe(403);
  });

  it("POST /messages requires content, max 2000", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    const a = await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "  " });
    expect(a.status).toBe(400);

    const b = await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "x".repeat(2001) });
    expect(b.status).toBe(400);
  });

  it("Host can post messages", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;
    const res = await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "Bonjour" });
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe("Bonjour");
  });

  it("DELETE only allowed for host", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    const stranger = await createTestUser();
    const f = await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${stranger.token}`);
    expect(f.status).toBe(403);

    const ok = await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("ended");
  });

  it("POST /leave marks user as left", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;
    const res = await harness.req().post(`/api/v1/sessions/${code}/leave`).set("Authorization", `Bearer ${host.token}`);
    expect(res.body.data.left).toBe(true);
  });

  it("GET /sessions/[code] returns session with participants list", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "protocol" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    const guest = await createTestUser();
    await harness.req().post(`/api/v1/sessions/${code}/join`).set("Authorization", `Bearer ${guest.token}`);

    const res = await harness.req().get(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.participants)).toBe(true);
    expect(res.body.data.participants.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.participants[0]).toHaveProperty("userId");
    expect(res.body.data.participants[0]).toHaveProperty("userName");
  });

  it("DELETE /sessions/[code] is idempotent when already ended", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);
    const second = await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);
    expect(second.status).toBe(200);
    expect(second.body.data.status).toBe("ended");
  });

  it("GET /messages returns messages for participant", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "Premier message" });

    const res = await harness.req().get(`/api/v1/sessions/${code}/messages`).set("Authorization", `Bearer ${host.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].content).toBe("Premier message");
    expect(res.body.data[0]).toHaveProperty("authorName");
  });

  it("GET /messages filters by ?since parameter", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "Old message" });

    const since = new Date().toISOString();

    await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "New message" });

    const res = await harness
      .req()
      .get(`/api/v1/sessions/${code}/messages?since=${encodeURIComponent(since)}`)
      .set("Authorization", `Bearer ${host.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /messages rejects non-participants", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    const stranger = await createTestUser();
    const res = await harness
      .req()
      .get(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(res.status).toBe(403);
  });

  it("GET /messages 404 for unknown code", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .get("/api/v1/sessions/UNKNOWN1/messages")
      .set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(404);
  });

  it("POST /messages 404 for unknown code", async () => {
    const u = await createTestUser();
    const res = await harness
      .req()
      .post("/api/v1/sessions/UNKNOWN1/messages")
      .set("Authorization", `Bearer ${u.token}`)
      .send({ content: "hello" });
    expect(res.status).toBe(404);
  });

  it("POST /messages rejects sending to ended session", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);

    const res = await harness
      .req()
      .post(`/api/v1/sessions/${code}/messages`)
      .set("Authorization", `Bearer ${host.token}`)
      .send({ content: "too late" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATE");
  });

  it("POST /join requires auth", async () => {
    const res = await harness.req().post("/api/v1/sessions/UNKNOWN1/join");
    expect(res.status).toBe(401);
  });

  it("POST /join 404 for unknown session", async () => {
    const u = await createTestUser();
    const res = await harness.req().post("/api/v1/sessions/UNKNOWN1/join").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(404);
  });

  it("POST /join rejects ended session", async () => {
    const host = await createTestUser();
    const r = await createTestResource({ authorId: host.id, status: "published", mediaType: "exercise" });
    const created = await createCollabSession(host.token, r.id);
    const code = created.body.data.shareCode;

    await harness.req().delete(`/api/v1/sessions/${code}`).set("Authorization", `Bearer ${host.token}`);

    const guest = await createTestUser();
    const res = await harness.req().post(`/api/v1/sessions/${code}/join`).set("Authorization", `Bearer ${guest.token}`);
    expect(res.status).toBe(400);
  });

  it("POST /leave requires auth", async () => {
    const res = await harness.req().post("/api/v1/sessions/UNKNOWN1/leave");
    expect(res.status).toBe(401);
  });

  it("POST /leave 404 for unknown session", async () => {
    const u = await createTestUser();
    const res = await harness.req().post("/api/v1/sessions/UNKNOWN1/leave").set("Authorization", `Bearer ${u.token}`);
    expect(res.status).toBe(404);
  });
});
