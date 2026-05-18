import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSession = vi.fn();
const uploadObject = vi.fn();

vi.mock("@/lib/auth-server", () => ({
  getServerSession: () => getServerSession(),
}));

vi.mock("@/lib/s3", () => ({
  uploadObject: (...args: unknown[]) => uploadObject(...args),
  getPublicUrl: (k: string) => `https://cdn.example.com/${k}`,
}));

import { POST } from "@/app/api/upload/route";
import type { NextRequest } from "next/server";

function buildReq(formData: FormData): NextRequest {
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getServerSession.mockReset();
  uploadObject.mockReset();
});

describe("POST /api/upload", () => {
  it("401 when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(buildReq(new FormData()));
    expect(res.status).toBe(401);
  });

  it("400 when no file", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await POST(buildReq(new FormData()));
    expect(res.status).toBe(400);
  });

  it("400 for forbidden mime type", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const fd = new FormData();
    fd.append("file", new File(["x"], "evil.exe", { type: "application/x-msdownload" }));
    const res = await POST(buildReq(fd));
    expect(res.status).toBe(400);
  });

  it("400 when file exceeds 50MB", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    const big = new Uint8Array(51 * 1024 * 1024);
    const fd = new FormData();
    fd.append("file", new File([big], "big.png", { type: "image/png" }));
    const res = await POST(buildReq(fd));
    expect(res.status).toBe(400);
  });

  it("uploads to s3 and returns publicUrl", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    uploadObject.mockResolvedValue(undefined);
    const fd = new FormData();
    fd.append("file", new File(["hello"], "img.png", { type: "image/png" }));
    const res = await POST(buildReq(fd));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.publicUrl).toMatch(/^https:\/\/cdn\.example\.com\/u1\//);
    expect(body.publicUrl).toMatch(/\.png$/);
  });

  it("500 on s3 error", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1" } });
    uploadObject.mockRejectedValue(new Error("Boom"));
    const fd = new FormData();
    fd.append("file", new File(["x"], "a.png", { type: "image/png" }));
    const res = await POST(buildReq(fd));
    expect(res.status).toBe(500);
  });
});
