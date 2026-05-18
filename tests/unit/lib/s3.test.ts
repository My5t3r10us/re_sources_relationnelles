import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("s3", () => {
  describe("getPublicUrl", () => {
    it("uses AWS_PUBLIC_URL when set", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getPublicUrl } = await import("@/lib/s3");
      expect(getPublicUrl("a/b.png")).toBe("https://cdn.example.com/a/b.png");
    });

    it("strips trailing slash from AWS_PUBLIC_URL", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com/";
      const { getPublicUrl } = await import("@/lib/s3");
      expect(getPublicUrl("a.png")).toBe("https://cdn.example.com/a.png");
    });

    it("falls back to tigrisfiles host with bucket", async () => {
      delete process.env.AWS_PUBLIC_URL;
      process.env.AWS_BUCKET = "mybucket";
      const { getPublicUrl } = await import("@/lib/s3");
      expect(getPublicUrl("img.png")).toBe("https://mybucket.t3.tigrisfiles.io/img.png");
    });
  });

  describe("getObjectKeyFromUrl", () => {
    it("strips public prefix when url matches", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/path/to/file.png")).toBe("path/to/file.png");
    });

    it("strips legacy endpoint+bucket prefix", async () => {
      delete process.env.AWS_PUBLIC_URL;
      process.env.AWS_BUCKET = "buck";
      process.env.AWS_ENDPOINT_URL_S3 = "https://s3.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://s3.example.com/buck/key.png")).toBe("key.png");
    });

    it("returns null for unrelated url", async () => {
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://other.example.com/foo.png")).toBeNull();
    });
  });

  describe("getS3Client", () => {
    it("returns a singleton instance", async () => {
      const { getS3Client } = await import("@/lib/s3");
      const a = getS3Client();
      const b = getS3Client();
      expect(a).toBe(b);
    });
  });
});
