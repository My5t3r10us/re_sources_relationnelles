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
    it("strips public prefix when the key belongs to the owner", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/u1/file.png", "u1")).toBe("u1/file.png");
    });

    it("strips legacy endpoint+bucket prefix", async () => {
      delete process.env.AWS_PUBLIC_URL;
      process.env.AWS_BUCKET = "buck";
      process.env.AWS_ENDPOINT_URL_S3 = "https://s3.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://s3.example.com/buck/u1/key.png", "u1")).toBe("u1/key.png");
    });

    it("returns null for unrelated url", async () => {
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://other.example.com/foo.png", "u1")).toBeNull();
    });

    // ── Régression C-4 ────────────────────────────────────────────────
    // `imageUrl` et `attachments[].url` sont fournis par le client, et les
    // clés des victimes sont publiquement lisibles sur chaque ressource du
    // catalogue : il suffisait de créer une ressource pointant sur le fichier
    // d'autrui puis de la supprimer pour le détruire.
    it("refuses a key belonging to another user", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/victime/photo.png", "attaquant")).toBeNull();
    });

    it("refuses a key at the bucket root (no owner prefix)", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/racine.png", "u1")).toBeNull();
    });

    it("refuses path traversal in the key", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/u1/../victime/p.png", "u1")).toBeNull();
    });

    it("refuses an owner prefix that is merely a string prefix of another", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      // « u1 » ne doit pas ouvrir l'accès aux objets de « u12 ».
      expect(getObjectKeyFromUrl("https://cdn.example.com/u12/p.png", "u1")).toBeNull();
    });

    it("refuses an empty owner", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { getObjectKeyFromUrl } = await import("@/lib/s3");
      expect(getObjectKeyFromUrl("https://cdn.example.com/u1/p.png", "")).toBeNull();
    });
  });

  describe("assertOwnedObjectUrl", () => {
    it("accepts an object uploaded by the same user", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { assertOwnedObjectUrl } = await import("@/lib/s3");
      expect(() => assertOwnedObjectUrl("https://cdn.example.com/u1/a.png", "u1")).not.toThrow();
    });

    it("rejects an object belonging to someone else", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { assertOwnedObjectUrl } = await import("@/lib/s3");
      expect(() => assertOwnedObjectUrl("https://cdn.example.com/u2/a.png", "u1")).toThrow();
    });

    it("rejects an URL pointing outside the bucket", async () => {
      process.env.AWS_PUBLIC_URL = "https://cdn.example.com";
      const { assertOwnedObjectUrl } = await import("@/lib/s3");
      expect(() => assertOwnedObjectUrl("https://evil.example.com/u1/a.png", "u1")).toThrow();
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

  describe("uploadObject", () => {
    it("sends PutObjectCommand with correct params", async () => {
      const sendMock = vi.fn().mockResolvedValue({});
      vi.doMock("@aws-sdk/client-s3", async (importOriginal) => {
        const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
        return {
          ...actual,
          S3Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
          PutObjectCommand: actual.PutObjectCommand,
        };
      });

      process.env.AWS_BUCKET = "test-bucket";
      const { uploadObject } = await import("@/lib/s3");
      const body = Buffer.from("hello");
      await uploadObject("path/to/file.png", body, "image/png");

      expect(sendMock).toHaveBeenCalledOnce();
      const [cmd] = sendMock.mock.calls[0];
      expect(cmd.input).toMatchObject({
        Bucket: "test-bucket",
        Key: "path/to/file.png",
        Body: body,
        ContentType: "image/png",
      });
    });
  });

  describe("deleteObject", () => {
    it("sends DeleteObjectCommand with correct key", async () => {
      const sendMock = vi.fn().mockResolvedValue({});
      vi.doMock("@aws-sdk/client-s3", async (importOriginal) => {
        const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
        return {
          ...actual,
          S3Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
          DeleteObjectCommand: actual.DeleteObjectCommand,
        };
      });

      process.env.AWS_BUCKET = "test-bucket";
      const { deleteObject } = await import("@/lib/s3");
      await deleteObject("path/to/file.png");

      expect(sendMock).toHaveBeenCalledOnce();
      const [cmd] = sendMock.mock.calls[0];
      expect(cmd.input).toMatchObject({
        Bucket: "test-bucket",
        Key: "path/to/file.png",
      });
    });
  });
});
